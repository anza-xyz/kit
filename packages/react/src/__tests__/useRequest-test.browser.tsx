import { createReactiveActionStore, ReactiveActionSource } from '@solana/subscribable';
import { act, renderHook } from '@testing-library/react';

import { useRequest } from '../useRequest';

function makeFakeRequest<T>(): {
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
            reactiveStore(options) {
                const store = createReactiveActionStore<[], T>(fn, options);
                store.dispatch();
                return store;
            },
        },
    };
}

describe('useRequest', () => {
    it('auto-dispatches on mount and transitions loading → loaded', async () => {
        const req = makeFakeRequest<string>();
        const { result } = renderHook(() => useRequest(req.source));

        expect(result.current.status).toBe('loading');
        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
        expect(req.fn).toHaveBeenCalledTimes(1);

        await act(async () => req.resolveLatest('hi'));
        expect(result.current.status).toBe('loaded');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBe('hi');
    });

    it('reports error status with the error value when the call rejects', async () => {
        const boom = new Error('boom');
        const req = makeFakeRequest<string>();
        const { result } = renderHook(() => useRequest(req.source));

        await act(async () => req.rejectLatest(boom));
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(boom);
    });

    it('refresh() re-dispatches and transitions retrying → loaded while preserving stale data', async () => {
        const req = makeFakeRequest<string>();
        const { result } = renderHook(() => useRequest(req.source));

        await act(async () => req.resolveLatest('first'));
        expect(result.current.data).toBe('first');
        expect(req.fn).toHaveBeenCalledTimes(1);

        act(() => result.current.refresh());
        expect(req.fn).toHaveBeenCalledTimes(2);
        expect(result.current.status).toBe('retrying');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBe('first');

        await act(async () => req.resolveLatest('second'));
        expect(result.current.status).toBe('loaded');
        expect(result.current.data).toBe('second');
    });

    it('rebuilds the store and fires a fresh request when the source identity changes', () => {
        const reqA = makeFakeRequest<string>();
        const reqB = makeFakeRequest<string>();
        const { rerender } = renderHook(
            ({ which }: { which: 'a' | 'b' }) => useRequest(which === 'a' ? reqA.source : reqB.source),
            { initialProps: { which: 'a' } },
        );
        expect(reqA.fn).toHaveBeenCalledTimes(1);
        expect(reqB.fn).not.toHaveBeenCalled();

        rerender({ which: 'b' });
        expect(reqB.fn).toHaveBeenCalledTimes(1);
    });

    it('reports status: disabled when the source is null', () => {
        const { result } = renderHook(() => useRequest<string>(null));
        expect(result.current.status).toBe('disabled');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
    });

    it('starts firing when the source transitions from null to a real source', () => {
        const req = makeFakeRequest<string>();
        const initialProps: { source: ReactiveActionSource<string> | null } = { source: null };
        const { result, rerender } = renderHook(({ source }) => useRequest(source), { initialProps });
        expect(result.current.status).toBe('disabled');
        expect(req.fn).not.toHaveBeenCalled();

        rerender({ source: req.source });
        expect(result.current.status).toBe('loading');
        expect(req.fn).toHaveBeenCalledTimes(1);
    });

    it('returns to disabled when the source transitions from a real source to null', async () => {
        const req = makeFakeRequest<string>();
        const initialProps: { source: ReactiveActionSource<string> | null } = { source: req.source };
        const { result, rerender } = renderHook(({ source }) => useRequest(source), { initialProps });
        await act(async () => req.resolveLatest('hi'));
        expect(result.current.status).toBe('loaded');

        rerender({ source: null });
        expect(result.current.status).toBe('disabled');
        expect(result.current.data).toBeUndefined();
    });

    it('aborts the in-flight request when the source transitions to null', () => {
        const req = makeFakeRequest<string>();
        const initialProps: { source: ReactiveActionSource<string> | null } = { source: req.source };
        const { rerender } = renderHook(({ source }) => useRequest(source), { initialProps });
        const inFlightSignal = req.fn.mock.calls[0]![0];
        expect(inFlightSignal.aborted).toBe(false);

        rerender({ source: null });
        expect(inFlightSignal.aborted).toBe(true);
    });

    it('aborts the in-flight request when the component unmounts', () => {
        const req = makeFakeRequest<string>();
        const { unmount } = renderHook(() => useRequest(req.source));
        const inFlightSignal = req.fn.mock.calls[0]![0];
        expect(inFlightSignal.aborted).toBe(false);

        unmount();
        expect(inFlightSignal.aborted).toBe(true);
    });

    it('keeps a stable refresh reference across re-renders', () => {
        const req = makeFakeRequest<string>();
        const { result, rerender } = renderHook(() => useRequest(req.source));
        const { refresh } = result.current;
        rerender();
        expect(result.current.refresh).toBe(refresh);
    });

    it('invokes perRequestSignal on every attempt with a fresh signal', () => {
        const req = makeFakeRequest<string>();
        const signals: AbortSignal[] = [];
        const perRequestSignal = jest.fn(() => {
            const ctrl = new AbortController();
            signals.push(ctrl.signal);
            return ctrl.signal;
        });
        const { result } = renderHook(() => useRequest(req.source, { perRequestSignal }));

        expect(perRequestSignal).toHaveBeenCalledTimes(1);

        act(() => result.current.refresh());
        expect(perRequestSignal).toHaveBeenCalledTimes(2);
        expect(signals[1]).not.toBe(signals[0]); // fresh identity per attempt
    });

    it('aborting the perRequestSignal transitions the current attempt to error; refresh starts a fresh one', async () => {
        const req = makeFakeRequest<string>();
        let currentCtrl: AbortController | undefined;
        const perRequestSignal = () => {
            currentCtrl = new AbortController();
            return currentCtrl.signal;
        };
        const { result } = renderHook(() => useRequest(req.source, { perRequestSignal }));

        const timeoutReason = new Error('timeout');
        await act(async () => currentCtrl!.abort(timeoutReason));
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(timeoutReason);

        act(() => result.current.refresh());
        expect(currentCtrl!.signal.aborted).toBe(false); // brand-new controller for the new attempt

        await act(async () => req.resolveLatest('recovered'));
        expect(result.current.status).toBe('loaded');
        expect(result.current.data).toBe('recovered');
    });
});
