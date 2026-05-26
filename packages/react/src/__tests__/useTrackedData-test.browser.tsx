import type { RpcSendable, RpcSubscribable, SolanaRpcResponse } from '@solana/kit';
import { act } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { renderHook } from '../__test-utils__/render';
import { TrackedDataSpec, useTrackedData } from '../useTrackedData';

type TestValue = { count: number };

function rpcResponse(slot: number, value: TestValue): SolanaRpcResponse<TestValue> {
    return { context: { slot: BigInt(slot) }, value };
}

function createMockRpcRequest(): {
    mockRequest: RpcSendable<SolanaRpcResponse<TestValue>>;
    reject(error: unknown): void;
    resolve(response: SolanaRpcResponse<TestValue>): void;
} {
    const { promise, resolve, reject } = Promise.withResolvers<SolanaRpcResponse<TestValue>>();
    return {
        mockRequest: {
            send: jest.fn().mockReturnValue(promise),
        },
        reject,
        resolve,
    };
}

function createMockSubscriptionRequest(): {
    error(err: unknown): void;
    mockRequest: RpcSubscribable<SolanaRpcResponse<TestValue>>;
    pushNotification(notification: SolanaRpcResponse<TestValue>): void;
} {
    const notifications: SolanaRpcResponse<TestValue>[] = [];
    let waitingResolve: ((value: IteratorResult<SolanaRpcResponse<TestValue>>) => void) | null = null;
    let waitingReject: ((reason: unknown) => void) | null = null;
    let errorValue: unknown;
    let hasError = false;

    const asyncIterable: AsyncIterable<SolanaRpcResponse<TestValue>> = {
        [Symbol.asyncIterator]() {
            return {
                next() {
                    if (notifications.length > 0) {
                        return Promise.resolve({ done: false, value: notifications.shift()! } as const);
                    }
                    if (hasError) {
                        return Promise.reject(errorValue as Error);
                    }
                    return new Promise<IteratorResult<SolanaRpcResponse<TestValue>>>((resolve, reject) => {
                        waitingResolve = resolve;
                        waitingReject = reject;
                    });
                },
            };
        },
    };

    return {
        error(err) {
            hasError = true;
            errorValue = err;
            if (waitingReject) {
                const reject = waitingReject;
                waitingResolve = null;
                waitingReject = null;
                reject(err);
            }
        },
        mockRequest: {
            subscribe: jest.fn().mockResolvedValue(asyncIterable),
        },
        pushNotification(notification) {
            if (waitingResolve) {
                const resolve = waitingResolve;
                waitingResolve = null;
                resolve({ done: false, value: notification });
            } else {
                notifications.push(notification);
            }
        },
    };
}

type Spec = TrackedDataSpec<TestValue, TestValue, number>;
function makeSpec(): {
    error: (err: unknown) => void;
    pushNotification: (notification: SolanaRpcResponse<TestValue>) => void;
    rejectRpc: (error: unknown) => void;
    resolveRpc: (response: SolanaRpcResponse<TestValue>) => void;
    rpcSendCalls: () => number;
    spec: Spec;
    subscribeCalls: () => number;
} {
    const rpc = createMockRpcRequest();
    const sub = createMockSubscriptionRequest();
    return {
        error: sub.error,
        pushNotification: sub.pushNotification,
        rejectRpc: rpc.reject,
        resolveRpc: rpc.resolve,
        rpcSendCalls: () => (rpc.mockRequest.send as jest.Mock).mock.calls.length,
        spec: {
            rpcRequest: rpc.mockRequest,
            rpcSubscriptionRequest: sub.mockRequest,
            rpcSubscriptionValueMapper: v => v.count,
            rpcValueMapper: v => v.count,
        },
        subscribeCalls: () => (sub.mockRequest.subscribe as jest.Mock).mock.calls.length,
    };
}

describe('useTrackedData', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    it('starts in loading, transitions to loaded with the initial RPC value', async () => {
        const { spec, resolveRpc } = makeSpec();
        const { result } = renderHook(() => useTrackedData(spec));

        expect(result.current.status).toBe('loading');
        expect(result.current.data).toBeUndefined();

        await act(async () => {
            resolveRpc(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.status).toBe('loaded');
        expect(result.current.data).toStrictEqual({ context: { slot: 100n }, value: 42 });
    });

    it('promotes a subscription notification over the initial RPC when the slot is newer', async () => {
        const { spec, resolveRpc, pushNotification } = makeSpec();
        const { result } = renderHook(() => useTrackedData(spec));
        await act(async () => {
            resolveRpc(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.data).toStrictEqual({ context: { slot: 100n }, value: 1 });

        await act(async () => {
            pushNotification(rpcResponse(200, { count: 2 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.data).toStrictEqual({ context: { slot: 200n }, value: 2 });
    });

    it('drops a stale subscription notification with a slot older than the current value', async () => {
        const { spec, resolveRpc, pushNotification } = makeSpec();
        const { result } = renderHook(() => useTrackedData(spec));
        await act(async () => {
            resolveRpc(rpcResponse(200, { count: 99 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.data).toStrictEqual({ context: { slot: 200n }, value: 99 });

        // Older slot — store ignores; UI keeps the newer value.
        await act(async () => {
            pushNotification(rpcResponse(150, { count: 7 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.data).toStrictEqual({ context: { slot: 200n }, value: 99 });
    });

    it('drops the initial RPC value when a newer subscription notification arrived first', async () => {
        const { spec, resolveRpc, pushNotification } = makeSpec();
        const { result } = renderHook(() => useTrackedData(spec));
        // Subscription arrives first at a newer slot.
        await act(async () => {
            pushNotification(rpcResponse(300, { count: 5 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.data).toStrictEqual({ context: { slot: 300n }, value: 5 });

        // Then the initial RPC resolves with an older slot — must NOT regress the value.
        await act(async () => {
            resolveRpc(rpcResponse(200, { count: 99 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.data).toStrictEqual({ context: { slot: 300n }, value: 5 });
    });

    it('transitions to error when the initial RPC rejects, preserving stale data if any', async () => {
        const { spec, rejectRpc, pushNotification } = makeSpec();
        const { result } = renderHook(() => useTrackedData(spec));
        // Subscription delivers a value first.
        await act(async () => {
            pushNotification(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        const boom = new Error('boom');
        await act(async () => {
            rejectRpc(boom);
            await jest.runAllTimersAsync();
        });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(boom);
        expect(result.current.data).toStrictEqual({ context: { slot: 100n }, value: 1 }); // stale preserved
    });

    it('refresh() re-runs the pair and returns to loading with stale data preserved', async () => {
        const { spec, resolveRpc, pushNotification, rpcSendCalls, subscribeCalls } = makeSpec();
        const { result } = renderHook(() => useTrackedData(spec));
        await act(async () => {
            resolveRpc(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        await act(async () => {
            pushNotification(rpcResponse(150, { count: 2 }));
            await jest.runAllTimersAsync();
        });
        expect(rpcSendCalls()).toBe(1);
        expect(subscribeCalls()).toBe(1);

        act(() => result.current.refresh());
        // Both sources re-fire.
        expect(rpcSendCalls()).toBe(2);
        expect(subscribeCalls()).toBe(2);
        // Status returns to loading with stale data preserved.
        expect(result.current.status).toBe('loading');
        expect(result.current.data).toStrictEqual({ context: { slot: 150n }, value: 2 });
    });

    it('reports status: disabled when the spec is null', () => {
        const { result } = renderHook(() => useTrackedData<TestValue, TestValue, number>(null));
        expect(result.current.status).toBe('disabled');
        expect(result.current.data).toBeUndefined();
    });

    it('starts running when the spec transitions from null to a real one', async () => {
        const fake = makeSpec();
        const initialProps: { spec: Spec | null } = { spec: null };
        const { result, rerender } = renderHook(({ spec }) => useTrackedData(spec), { initialProps });
        expect(result.current.status).toBe('disabled');
        expect(fake.rpcSendCalls()).toBe(0);

        rerender({ spec: fake.spec });
        expect(result.current.status).toBe('loading');
        await act(async () => {
            fake.resolveRpc(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.status).toBe('loaded');
        expect(result.current.data).toStrictEqual({ context: { slot: 100n }, value: 1 });
    });

    it('returns to disabled when the spec transitions to null', async () => {
        const fake = makeSpec();
        const initialProps: { spec: Spec | null } = { spec: fake.spec };
        const { result, rerender } = renderHook(({ spec }) => useTrackedData(spec), { initialProps });
        await act(async () => {
            fake.resolveRpc(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.status).toBe('loaded');

        rerender({ spec: null });
        expect(result.current.status).toBe('disabled');
        expect(result.current.data).toBeUndefined();
    });

    it('rebuilds the store when the spec identity changes', async () => {
        const a = makeSpec();
        const b = makeSpec();
        const { result, rerender } = renderHook(({ spec }: { spec: Spec }) => useTrackedData(spec), {
            initialProps: { spec: a.spec },
        });
        await act(async () => {
            a.resolveRpc(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        expect(result.current.data).toStrictEqual({ context: { slot: 100n }, value: 1 });

        rerender({ spec: b.spec });
        expect(result.current.status).toBe('loading');
        await act(async () => {
            b.resolveRpc(rpcResponse(50, { count: 2 }));
            await jest.runAllTimersAsync();
        });
        // Fresh store → slot tracking resets, so 50 is accepted as the new baseline.
        expect(result.current.data).toStrictEqual({ context: { slot: 50n }, value: 2 });
    });

    it('keeps a stable refresh reference across re-renders', () => {
        const { spec } = makeSpec();
        const { result, rerender } = renderHook(() => useTrackedData(spec));
        const { refresh } = result.current;
        rerender();
        expect(result.current.refresh).toBe(refresh);
    });

    it('invokes `getAbortSignal` on every attempt with a fresh signal', async () => {
        const fake = makeSpec();
        const signals: AbortSignal[] = [];
        const getAbortSignal = jest.fn(() => {
            const ctrl = new AbortController();
            signals.push(ctrl.signal);
            return ctrl.signal;
        });
        const { result } = renderHook(() => useTrackedData(fake.spec, { getAbortSignal }));
        await act(async () => {
            fake.resolveRpc(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        expect(getAbortSignal).toHaveBeenCalledTimes(1);

        act(() => result.current.refresh());
        expect(getAbortSignal).toHaveBeenCalledTimes(2);
        expect(signals[1]).not.toBe(signals[0]);
    });

    it('refresh({ abortSignal }) overrides the factory for that attempt', async () => {
        const fake = makeSpec();
        const getAbortSignal = jest.fn(() => new AbortController().signal);
        const { result } = renderHook(() => useTrackedData(fake.spec, { getAbortSignal }));
        await act(async () => {
            fake.resolveRpc(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        expect(getAbortSignal).toHaveBeenCalledTimes(1);

        const overrideCtrl = new AbortController();
        act(() => result.current.refresh({ abortSignal: overrideCtrl.signal }));
        expect(getAbortSignal).toHaveBeenCalledTimes(1); // factory NOT called

        await act(async () => {
            overrideCtrl.abort(new Error('overridden'));
            await jest.runAllTimersAsync();
        });
        expect(result.current.status).toBe('error');
    });

    it('refresh({ abortSignal: undefined }) opts out of the factory for that attempt', async () => {
        const fake = makeSpec();
        const getAbortSignal = jest.fn(() => new AbortController().signal);
        const { result } = renderHook(() => useTrackedData(fake.spec, { getAbortSignal }));
        await act(async () => {
            fake.resolveRpc(rpcResponse(100, { count: 1 }));
            await jest.runAllTimersAsync();
        });
        expect(getAbortSignal).toHaveBeenCalledTimes(1);

        act(() => result.current.refresh({ abortSignal: undefined }));
        expect(getAbortSignal).toHaveBeenCalledTimes(1); // factory NOT called
        expect(fake.rpcSendCalls()).toBe(2);
    });

    it('aborts the in-flight attempt when the component unmounts', () => {
        const { spec, rpcSendCalls } = makeSpec();
        const { unmount } = renderHook(() => useTrackedData(spec));
        expect(rpcSendCalls()).toBe(1);
        const abortSignal = (spec.rpcRequest.send as jest.Mock).mock.calls[0][0].abortSignal as AbortSignal;
        expect(abortSignal.aborted).toBe(false);
        unmount();
        expect(abortSignal.aborted).toBe(true);
    });

    describe('SSR', () => {
        it('renders `loading` on the server without firing the RPC or subscription', () => {
            const fake = makeSpec();
            function Component() {
                const { status } = useTrackedData(fake.spec);
                return <p>{status}</p>;
            }
            const html = renderToString(<Component />);
            expect(html).toBe('<p>loading</p>');
            expect(fake.rpcSendCalls()).toBe(0);
            expect(fake.subscribeCalls()).toBe(0);
        });

        it('renders `disabled` on the server when the spec is null', () => {
            function Component() {
                const { status } = useTrackedData<TestValue, TestValue, number>(null);
                return <p>{status}</p>;
            }
            const html = renderToString(<Component />);
            expect(html).toBe('<p>disabled</p>');
        });
    });
});
