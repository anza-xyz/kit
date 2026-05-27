import { SolanaRpcResponse } from '@solana/kit';
import { createReactiveStoreFromDataPublisherFactory, DataPublisher, ReactiveStreamSource } from '@solana/subscribable';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SWRConfig } from 'swr';

import { useSubscriptionSwr } from '../useSubscriptionSwr';

function wrapper({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig value={{ provider: () => new Map() }}>
            {children}
        </SWRConfig>
    );
}

type Notification<T> = SolanaRpcResponse<T> | T;

function makeFakeSubscription<T>(): {
    publish: (notification: Notification<T>) => Promise<void>;
    publishError: (err: unknown) => Promise<void>;
    source: ReactiveStreamSource<T>;
} {
    type Listener = (payload: unknown) => void;
    let dataListeners: Listener[] = [];
    let errorListeners: Listener[] = [];
    let publisherReady = Promise.withResolvers<void>();
    return {
        async publish(notification) {
            await publisherReady.promise;
            dataListeners.forEach(fn => fn(notification));
        },
        async publishError(err) {
            await publisherReady.promise;
            errorListeners.forEach(fn => fn(err));
        },
        source: {
            reactiveStore() {
                return createReactiveStoreFromDataPublisherFactory<T>({
                    createDataPublisher() {
                        dataListeners = [];
                        errorListeners = [];
                        publisherReady = Promise.withResolvers<void>();
                        let onCallCount = 0;
                        const publisher: DataPublisher = {
                            on(channel, listener, options) {
                                const list = channel === 'data' ? dataListeners : errorListeners;
                                list.push(listener);
                                options?.signal.addEventListener(
                                    'abort',
                                    () => {
                                        const idx = list.indexOf(listener);
                                        if (idx !== -1) list.splice(idx, 1);
                                    },
                                    { once: true },
                                );
                                if (++onCallCount === 2) publisherReady.resolve();
                                return () => {
                                    const idx = list.indexOf(listener);
                                    if (idx !== -1) list.splice(idx, 1);
                                };
                            },
                        };
                        return Promise.resolve(publisher);
                    },
                    dataChannelName: 'data',
                    errorChannelName: 'error',
                });
            },
        },
    };
}

describe('useSubscriptionSwr', () => {
    it('returns the latest notification as `data.value` and lifts `slot` from the envelope', async () => {
        const sub = makeFakeSubscription<SolanaRpcResponse<{ lamports: bigint }>>();
        const { result } = renderHook(() => useSubscriptionSwr(['account'], sub.source), { wrapper });
        // Sync point — let SWR's subscription wire up before the first publish.
        expect(result.current.data).toBeUndefined();

        await act(async () => sub.publish({ context: { slot: 99n }, value: { lamports: 5n } }));
        await waitFor(() => expect(result.current.data?.value).toStrictEqual({ lamports: 5n }));
        expect(result.current.data?.slot).toBe(99n);
    });

    it('passes raw values through with `slot: undefined`', async () => {
        const sub = makeFakeSubscription<{ slot: bigint }>();
        const { result } = renderHook(() => useSubscriptionSwr(['slot'], sub.source), { wrapper });
        expect(result.current.data).toBeUndefined();

        await act(async () => sub.publish({ slot: 10n }));
        await waitFor(() => expect(result.current.data?.value).toStrictEqual({ slot: 10n }));
        expect(result.current.data?.slot).toBeUndefined();
    });

    it('surfaces error-channel publishes as `result.error`', async () => {
        const sub = makeFakeSubscription<{ value: number }>();
        const { result } = renderHook(() => useSubscriptionSwr(['err'], sub.source), { wrapper });
        expect(result.current.error).toBeUndefined();

        const boom = new Error('boom');
        await act(async () => sub.publishError(boom));
        await waitFor(() => expect(result.current.error).toBe(boom));
    });

    it('skips the subscription when the key is null', async () => {
        const reactiveStore = jest.fn();
        const source: ReactiveStreamSource<{ value: number }> = { reactiveStore };
        renderHook(() => useSubscriptionSwr(null, source), { wrapper });
        await act(async () => {
            await Promise.resolve();
        });
        expect(reactiveStore).not.toHaveBeenCalled();
    });

    it('skips the subscription when the source is null (even if the key is non-null)', async () => {
        const { result } = renderHook(
            () => useSubscriptionSwr<{ value: number }>(['key-set'], null),
            { wrapper },
        );
        await act(async () => {
            await Promise.resolve();
        });
        expect(result.current.data).toBeUndefined();
    });

    it('passes the user-supplied `getAbortSignal` signal into `withSignal`', async () => {
        const sub = makeFakeSubscription<{ value: number }>();
        const ctrl = new AbortController();
        const { result } = renderHook(
            () => useSubscriptionSwr(['user-signal'], sub.source, { getAbortSignal: () => ctrl.signal }),
            { wrapper },
        );
        expect(result.current.error).toBeUndefined();

        const reason = new Error('timeout');
        await act(async () => ctrl.abort(reason));
        await waitFor(() => expect(result.current.error).toBe(reason));
    });

    describe('SSR', () => {
        it('renders without opening the subscription', () => {
            const reactiveStore = jest.fn();
            const source: ReactiveStreamSource<{ value: number }> = { reactiveStore };
            function Component() {
                const { data } = useSubscriptionSwr(['ssr'], source);
                return <p>{data ? 'has-data' : 'no-data'}</p>;
            }
            const html = renderToString(
                <SWRConfig value={{ provider: () => new Map() }}>
                    <Component />
                </SWRConfig>,
            );
            expect(html).toBe('<p>no-data</p>');
            expect(reactiveStore).not.toHaveBeenCalled();
        });
    });
});
