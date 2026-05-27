import type { RpcSendable, RpcSubscribable, SolanaRpcResponse } from '@solana/kit';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SWRConfig } from 'swr';

import type { TrackedDataSpec } from '../../useTrackedData';
import { useTrackedDataSwr } from '../useTrackedDataSwr';

function wrapper({ children }: { children: React.ReactNode }) {
    return <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>;
}

type TestValue = { count: number };

function rpcResponse(slot: number, value: TestValue): SolanaRpcResponse<TestValue> {
    return { context: { slot: BigInt(slot) }, value };
}

function makeFakeRpc(): {
    mockRequest: RpcSendable<SolanaRpcResponse<TestValue>>;
    reject(err: unknown): void;
    resolve(response: SolanaRpcResponse<TestValue>): void;
} {
    const { promise, resolve, reject } = Promise.withResolvers<SolanaRpcResponse<TestValue>>();
    return {
        mockRequest: { send: jest.fn().mockReturnValue(promise) },
        reject,
        resolve,
    };
}

function makeFakeSubscription(): {
    mockRequest: RpcSubscribable<SolanaRpcResponse<TestValue>>;
    pushNotification(notification: SolanaRpcResponse<TestValue>): void;
} {
    const notifications: SolanaRpcResponse<TestValue>[] = [];
    let waitingResolve: ((value: IteratorResult<SolanaRpcResponse<TestValue>>) => void) | null = null;
    const asyncIterable: AsyncIterable<SolanaRpcResponse<TestValue>> = {
        [Symbol.asyncIterator]() {
            return {
                next() {
                    if (notifications.length > 0) {
                        return Promise.resolve({ done: false, value: notifications.shift()! } as const);
                    }
                    return new Promise<IteratorResult<SolanaRpcResponse<TestValue>>>(resolve => {
                        waitingResolve = resolve;
                    });
                },
            };
        },
    };
    return {
        mockRequest: { subscribe: jest.fn().mockResolvedValue(asyncIterable) },
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
    pushNotification: (notification: SolanaRpcResponse<TestValue>) => void;
    resolveRpc: (response: SolanaRpcResponse<TestValue>) => void;
    spec: Spec;
} {
    const rpc = makeFakeRpc();
    const sub = makeFakeSubscription();
    return {
        pushNotification: sub.pushNotification,
        resolveRpc: rpc.resolve,
        spec: {
            rpcRequest: rpc.mockRequest,
            rpcSubscriptionRequest: sub.mockRequest,
            rpcSubscriptionValueMapper: v => v.count,
            rpcValueMapper: v => v.count,
        },
    };
}

describe('useTrackedDataSwr', () => {
    it('surfaces the initial RPC value as `data.value` with the envelope slot', async () => {
        const { spec, resolveRpc } = makeSpec();
        const { result } = renderHook(() => useTrackedDataSwr(['balance'], spec), { wrapper });
        expect(result.current.data).toBeUndefined();

        await act(async () => resolveRpc(rpcResponse(100, { count: 42 })));
        await waitFor(() => expect(result.current.data?.value).toBe(42));
        expect(result.current.data?.slot).toBe(100n);
    });

    it('promotes a newer subscription notification over the initial RPC', async () => {
        const { spec, resolveRpc, pushNotification } = makeSpec();
        const { result } = renderHook(() => useTrackedDataSwr(['promote'], spec), { wrapper });
        expect(result.current.data).toBeUndefined();

        await act(async () => resolveRpc(rpcResponse(100, { count: 1 })));
        await waitFor(() => expect(result.current.data?.value).toBe(1));

        await act(async () => pushNotification(rpcResponse(200, { count: 2 })));
        await waitFor(() => expect(result.current.data?.value).toBe(2));
        expect(result.current.data?.slot).toBe(200n);
    });

    it('skips when the key is null', async () => {
        const { spec } = makeSpec();
        const { result } = renderHook(() => useTrackedDataSwr(null, spec), { wrapper });
        await act(async () => {
            await Promise.resolve();
        });
        expect(result.current.data).toBeUndefined();
        expect((spec.rpcRequest.send as jest.Mock).mock.calls.length).toBe(0);
    });

    it('skips when the spec is null', async () => {
        const { result } = renderHook(
            () => useTrackedDataSwr<TestValue, TestValue, number>(['no-spec'], null),
            { wrapper },
        );
        await act(async () => {
            await Promise.resolve();
        });
        expect(result.current.data).toBeUndefined();
    });

    describe('SSR', () => {
        it('renders without firing the RPC or subscription', () => {
            const { spec } = makeSpec();
            function Component() {
                const { data } = useTrackedDataSwr(['ssr'], spec);
                return <p>{data ? 'has-data' : 'no-data'}</p>;
            }
            const html = renderToString(
                <SWRConfig value={{ provider: () => new Map() }}>
                    <Component />
                </SWRConfig>,
            );
            expect(html).toBe('<p>no-data</p>');
            expect((spec.rpcRequest.send as jest.Mock).mock.calls.length).toBe(0);
            expect((spec.rpcSubscriptionRequest.subscribe as jest.Mock).mock.calls.length).toBe(0);
        });
    });
});
