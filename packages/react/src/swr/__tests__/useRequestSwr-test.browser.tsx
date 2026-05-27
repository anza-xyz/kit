import type { ReactiveActionSource } from '@solana/subscribable';
import { createReactiveActionStore } from '@solana/subscribable';
import { act, waitFor } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SWRConfig } from 'swr';

import { renderHook } from '../../__test-utils__/render';
import { useRequestSwr } from '../useRequestSwr';

// Wrap every render in an SWRConfig that:
// - Uses a fresh provider Map so cache state never leaks between tests.
// - Disables retries so a rejected fetch surfaces as `error` immediately instead of triggering
//   SWR's exponential backoff.
// - Disables window-focus / network-reconnect revalidation so the test environment doesn't
//   accidentally re-fire fetches during assertions.
function wrapper({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                errorRetryCount: 0,
                provider: () => new Map(),
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
            }}
        >
            {children}
        </SWRConfig>
    );
}

function makeFakeSource<T>(): {
    fn: jest.Mock<Promise<T>, [AbortSignal]>;
    rejectLatest: (err: unknown) => void;
    resolveLatest: (value: T) => void;
    source: ReactiveActionSource<T>;
} {
    let latest: PromiseWithResolvers<T> | null = null;
    const fn = jest.fn<Promise<T>, [AbortSignal]>(() => {
        latest = Promise.withResolvers<T>();
        return latest.promise;
    });
    return {
        fn,
        rejectLatest(err) {
            latest!.reject(err);
        },
        resolveLatest(value) {
            latest!.resolve(value);
        },
        source: {
            reactiveStore() {
                return createReactiveActionStore<[], T>(fn);
            },
        },
    };
}

describe('useRequestSwr', () => {
    describe('with a function source', () => {
        it('auto-fires the fetcher on mount and transitions to data on success', async () => {
            const { promise, resolve } = Promise.withResolvers<string>();
            const fn = jest.fn<Promise<string>, [AbortSignal]>(() => promise);
            const { result } = renderHook(() => useRequestSwr(['fn-success'], fn), { wrapper });
            await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
            // Sync point — under SWR + jsdom, the cache entry needs to settle between the
            // fetcher being invoked and the deferred promise being resolved. Accessing
            // `result.current` here lets React commit the loading state before we trigger the
            // resolution.
            expect(result.current.data).toBeUndefined();

            await act(async () => resolve('hi'));
            await waitFor(() => expect(result.current.data).toBe('hi'));
            expect(result.current.error).toBeUndefined();
        });

        it('surfaces the rejection as `error`', async () => {
            const boom = new Error('boom');
            const { promise, reject } = Promise.withResolvers<string>();
            const fn = jest.fn<Promise<string>, [AbortSignal]>(() => promise);
            const { result } = renderHook(() => useRequestSwr(['fn-error'], fn), { wrapper });
            await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
            expect(result.current.error).toBeUndefined();

            await act(async () => reject(boom));
            await waitFor(() => expect(result.current.error).toBe(boom));
        });

        it('threads an `AbortSignal` into the function', async () => {
            const { promise, resolve } = Promise.withResolvers<string>();
            const fn = jest.fn<Promise<string>, [AbortSignal]>(() => promise);
            renderHook(() => useRequestSwr(['signal-threaded'], fn), { wrapper });
            await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
            const signal = fn.mock.calls[0][0];
            expect(signal).toBeInstanceOf(AbortSignal);
            expect(signal.aborted).toBe(false);
            await act(async () => resolve('ok'));
        });

        it('passes the user-supplied `getAbortSignal` signal through to the function', async () => {
            const { promise, resolve } = Promise.withResolvers<string>();
            const fn = jest.fn<Promise<string>, [AbortSignal]>(() => promise);
            const ctrl = new AbortController();
            const getAbortSignal = jest.fn(() => ctrl.signal);
            renderHook(() => useRequestSwr(['user-signal'], fn, { getAbortSignal }), { wrapper });
            await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
            expect(getAbortSignal).toHaveBeenCalledTimes(1);
            expect(fn.mock.calls[0][0]).toBe(ctrl.signal);
            await act(async () => resolve('ok'));
        });

        it('surfaces a `getAbortSignal`-driven abort as `result.error`', async () => {
            const fn = jest.fn<Promise<string>, [AbortSignal]>(
                signal =>
                    new Promise((_, reject) => {
                        signal.addEventListener('abort', () => reject(signal.reason));
                    }),
            );
            const ctrl = new AbortController();
            const { result } = renderHook(
                () => useRequestSwr(['user-signal-abort'], fn, { getAbortSignal: () => ctrl.signal }),
                { wrapper },
            );
            await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
            expect(result.current.error).toBeUndefined();

            const reason = new Error('timeout');
            await act(async () => ctrl.abort(reason));
            await waitFor(() => expect(result.current.error).toBe(reason));
        });
    });

    describe('with a ReactiveActionSource (PendingRpc-like)', () => {
        it('builds a store per fetch and resolves through `dispatchAsync()`', async () => {
            const req = makeFakeSource<string>();
            const { result } = renderHook(() => useRequestSwr(['source-success'], req.source), { wrapper });
            await waitFor(() => expect(req.fn).toHaveBeenCalledTimes(1));
            expect(result.current.data).toBeUndefined();

            await act(async () => req.resolveLatest('value'));
            await waitFor(() => expect(result.current.data).toBe('value'));
        });

        it('surfaces the rejection as `error`', async () => {
            const boom = new Error('boom');
            const req = makeFakeSource<string>();
            const { result } = renderHook(() => useRequestSwr(['source-error'], req.source), { wrapper });
            await waitFor(() => expect(req.fn).toHaveBeenCalledTimes(1));
            expect(result.current.error).toBeUndefined();

            await act(async () => req.rejectLatest(boom));
            await waitFor(() => expect(result.current.error).toBe(boom));
        });

        it('routes the user-supplied `getAbortSignal` signal through `withSignal`', async () => {
            const req = makeFakeSource<string>();
            const ctrl = new AbortController();
            const { result } = renderHook(
                () => useRequestSwr(['source-user-signal'], req.source, { getAbortSignal: () => ctrl.signal }),
                { wrapper },
            );
            await waitFor(() => expect(req.fn).toHaveBeenCalledTimes(1));
            expect(result.current.error).toBeUndefined();

            const reason = new Error('timeout');
            await act(async () => ctrl.abort(reason));
            await waitFor(() => expect(result.current.error).toBe(reason));
        });
    });

    it('skips the fetch when the key is null', async () => {
        const fn = jest.fn<Promise<string>, [AbortSignal]>(() => Promise.resolve('never'));
        const { result } = renderHook(() => useRequestSwr(null, fn), { wrapper });
        // Wait a tick to be sure SWR hasn't queued a fetch.
        await act(async () => {
            await Promise.resolve();
        });
        expect(fn).not.toHaveBeenCalled();
        expect(result.current.data).toBeUndefined();
    });

    it('skips the fetch when the source is null (even if the key is non-null)', async () => {
        const fn = jest.fn<Promise<string>, [AbortSignal]>(() => Promise.resolve('never'));
        const initialProps: { source: ((signal: AbortSignal) => Promise<string>) | null } = { source: null };
        const { result, rerender } = renderHook(({ source }) => useRequestSwr(['key-set'], source), {
            initialProps,
            wrapper,
        });
        await act(async () => {
            await Promise.resolve();
        });
        expect(fn).not.toHaveBeenCalled();
        expect(result.current.data).toBeUndefined();

        // Transition to a real source — fetch fires.
        rerender({ source: fn });
        await waitFor(() => expect(result.current.data).toBe('never'));
    });

    it('starts firing once the key transitions from null to non-null', async () => {
        const fn = jest.fn<Promise<string>, [AbortSignal]>(() => Promise.resolve('value'));
        const initialProps: { key: string | null } = { key: null };
        const { result, rerender } = renderHook(({ key }) => useRequestSwr(key, fn), { initialProps, wrapper });
        expect(fn).not.toHaveBeenCalled();

        rerender({ key: 'now-enabled' });
        await waitFor(() => expect(result.current.data).toBe('value'));
    });

    it('uses the latest source closure when `mutate()` is called', async () => {
        // SWR keys cache lookup — if the key is stable, a source-identity change alone won't
        // refetch. But the next fetch (e.g. via `mutate()`) should run the latest source. This
        // mirrors how SWR users normally encode source-dependent inputs in the key.
        const { result, rerender } = renderHook(
            ({ value }: { value: string }) => useRequestSwr(['latest-closure'], () => Promise.resolve(value)),
            { initialProps: { value: 'a' }, wrapper },
        );
        await waitFor(() => expect(result.current.data).toBe('a'));

        rerender({ value: 'b' });
        await act(async () => {
            await result.current.mutate();
        });
        await waitFor(() => expect(result.current.data).toBe('b'));
    });

    describe('SSR', () => {
        it('renders without firing the fetcher', () => {
            const fn = jest.fn<Promise<string>, [AbortSignal]>(() => Promise.resolve('never'));
            function Component() {
                const { data } = useRequestSwr(['ssr'], fn);
                return <p>{data ?? 'no-data'}</p>;
            }
            const html = renderToString(
                <SWRConfig value={{ provider: () => new Map() }}>
                    <Component />
                </SWRConfig>,
            );
            expect(html).toBe('<p>no-data</p>');
            // SWR fires the fetcher inside an effect — on the server, effects don't run.
            expect(fn).not.toHaveBeenCalled();
        });
    });
});
