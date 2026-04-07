import type { PendingRpcRequest } from '@solana/rpc';
import type { PendingRpcSubscriptionsRequest } from '@solana/rpc-subscriptions';
import type { SolanaRpcResponse } from '@solana/rpc-types';

import { createReactiveStoreFromRpcAndSubscription } from '../create-reactive-store-from-rpc-and-subscription';

/** Flush all pending microtasks by waiting for a macrotask boundary. */
const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

type TestValue = { count: number };

function createMockRpcRequest(): {
    mockRequest: PendingRpcRequest<SolanaRpcResponse<TestValue>>;
    reject(error: unknown): void;
    resolve(response: SolanaRpcResponse<TestValue>): void;
} {
    let resolve!: (response: SolanaRpcResponse<TestValue>) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<SolanaRpcResponse<TestValue>>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        mockRequest: { send: jest.fn().mockReturnValue(promise) },
        reject,
        resolve,
    };
}

function createMockSubscriptionRequest(): {
    complete(): void;
    error(err: unknown): void;
    mockRequest: PendingRpcSubscriptionsRequest<SolanaRpcResponse<TestValue>>;
    pushNotification(notification: SolanaRpcResponse<TestValue>): void;
} {
    const notifications: SolanaRpcResponse<TestValue>[] = [];
    let waitingResolve: ((value: IteratorResult<SolanaRpcResponse<TestValue>>) => void) | null = null;
    let waitingReject: ((reason: unknown) => void) | null = null;
    let done = false;
    let errorValue: unknown;
    let hasError = false;

    const asyncIterable: AsyncIterable<SolanaRpcResponse<TestValue>> = {
        [Symbol.asyncIterator]() {
            return {
                next() {
                    if (notifications.length > 0) {
                        return Promise.resolve({ done: false, value: notifications.shift()! } as const);
                    }
                    if (done) {
                        return Promise.resolve({ done: true, value: undefined } as const);
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

    const pushNotification = (notification: SolanaRpcResponse<TestValue>) => {
        if (waitingResolve) {
            const resolve = waitingResolve;
            waitingResolve = null;
            resolve({ done: false, value: notification });
        } else {
            notifications.push(notification);
        }
    };

    const error = (err: unknown) => {
        hasError = true;
        errorValue = err;
        if (waitingReject) {
            const reject = waitingReject;
            waitingResolve = null;
            waitingReject = null;
            reject(err);
        }
    };

    const complete = () => {
        done = true;
        if (waitingResolve) {
            const resolve = waitingResolve;
            waitingResolve = null;
            resolve({ done: true, value: undefined });
        }
    };

    return {
        complete,
        error,
        mockRequest: {
            reactive: jest.fn().mockRejectedValue(new Error('not implemented')),
            subscribe: jest.fn().mockResolvedValue(asyncIterable),
        },
        pushNotification,
    };
}

function rpcResponse(slot: number, value: TestValue): SolanaRpcResponse<TestValue> {
    return { context: { slot: BigInt(slot) }, value } as SolanaRpcResponse<TestValue>;
}

describe('createReactiveStoreFromRpcAndSubscription', () => {
    let abortController: AbortController;

    beforeEach(() => {
        abortController = new AbortController();
    });

    afterEach(() => {
        abortController.abort();
    });

    describe('getState()', () => {
        it('returns `undefined` before any data arrives', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            expect(store.getState()).toBeUndefined();
        });
        it('updates with the RPC response value', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            await flushMicrotasks();
            expect(store.getState()).toBe(42);
        });
        it('updates with a subscription notification value', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            await flushMicrotasks();
            pushNotification(rpcResponse(100, { count: 99 }));
            await flushMicrotasks();
            expect(store.getState()).toBe(99);
        });
        it('ignores the RPC response when a newer subscription notification has already arrived', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            await flushMicrotasks();
            pushNotification(rpcResponse(200, { count: 99 }));
            await flushMicrotasks();
            // RPC response arrives later at an older slot
            resolve(rpcResponse(100, { count: 42 }));
            await flushMicrotasks();
            expect(store.getState()).toBe(99);
        });
        it('ignores a subscription notification when the RPC response was at a newer slot', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            resolve(rpcResponse(200, { count: 42 }));
            await flushMicrotasks();
            pushNotification(rpcResponse(100, { count: 99 }));
            await flushMicrotasks();
            expect(store.getState()).toBe(42);
        });
        it('preserves the last known value after an error', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            await flushMicrotasks();
            error(new Error('subscription failed'));
            await flushMicrotasks();
            expect(store.getState()).toBe(42);
        });
    });

    describe('getError()', () => {
        it('returns `undefined` before any error', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            expect(store.getError()).toBeUndefined();
        });
        it('captures an error from the RPC request', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const error = new Error('rpc failed');
            reject(error);
            await flushMicrotasks();
            expect(store.getError()).toBe(error);
        });
        it('captures an error from the subscription', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            await flushMicrotasks();
            const subscriptionError = new Error('subscription failed');
            error(subscriptionError);
            await flushMicrotasks();
            expect(store.getError()).toBe(subscriptionError);
        });
        it('only captures the first error when RPC fails then subscription fails', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject: rejectRpc } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, error: errorSubscription } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            await flushMicrotasks();
            rejectRpc(new Error('rpc error'));
            await flushMicrotasks();
            errorSubscription(new Error('subscription error'));
            await flushMicrotasks();
            expect(store.getError()).toEqual(new Error('rpc error'));
        });
        it('only captures the first error when subscription fails then RPC fails', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject: rejectRpc } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, error: errorSubscription } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            await flushMicrotasks();
            errorSubscription(new Error('subscription error'));
            await flushMicrotasks();
            rejectRpc(new Error('rpc error'));
            await flushMicrotasks();
            expect(store.getError()).toEqual(new Error('subscription error'));
        });
    });

    describe('subscribe()', () => {
        it('calls the subscriber when the RPC response arrives', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            resolve(rpcResponse(100, { count: 42 }));
            await flushMicrotasks();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('calls the subscriber when a subscription notification arrives', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            await flushMicrotasks();
            pushNotification(rpcResponse(100, { count: 99 }));
            await flushMicrotasks();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('does not call the subscriber when an out-of-order notification is skipped', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            resolve(rpcResponse(200, { count: 42 }));
            await flushMicrotasks();
            subscriber.mockClear();
            await flushMicrotasks();
            // This notification is at an older slot and should be skipped
            pushNotification(rpcResponse(100, { count: 99 }));
            await flushMicrotasks();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('calls the subscriber when an error occurs', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            reject(new Error('fail'));
            await flushMicrotasks();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('calls the subscriber when a subscription error occurs', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            await flushMicrotasks();
            error(new Error('fail'));
            await flushMicrotasks();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('stops calling the subscriber after unsubscribe', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            const unsubscribe = store.subscribe(subscriber);
            unsubscribe();
            resolve(rpcResponse(100, { count: 42 }));
            await flushMicrotasks();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('the unsubscribe function is idempotent', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const unsubscribe = store.subscribe(jest.fn());
            expect(() => {
                unsubscribe();
                unsubscribe();
            }).not.toThrow();
        });
    });

    describe('abort signal', () => {
        it('aborts the signal passed to the RPC request when the caller aborts', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const rpcSignal = (rpcRequest.send as jest.Mock).mock.calls[0][0].abortSignal;
            expect(rpcSignal.aborted).toBe(false);
            abortController.abort('test reason');
            expect(rpcSignal.aborted).toBe(true);
            expect(rpcSignal.reason).toBe('test reason');
        });
        it('aborts the signal passed to the subscription request when the caller aborts', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            const subscriptionSignal = (subscriptionRequest.subscribe as jest.Mock).mock.calls[0][0].abortSignal;
            expect(subscriptionSignal.aborted).toBe(false);
            abortController.abort('test reason');
            expect(subscriptionSignal.aborted).toBe(true);
            expect(subscriptionSignal.reason).toBe('test reason');
        });
        it('swallows errors from the RPC request when the caller aborts', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            abortController.abort();
            reject(new Error('aborted'));
            await flushMicrotasks();
            expect(store.getError()).toBeUndefined();
        });
        it('swallows errors from the subscription when the caller aborts', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: subscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreFromRpcAndSubscription({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcValueMapper: v => v.count,
                subscriptionRequest,
                subscriptionValueMapper: v => v.count,
            });
            await flushMicrotasks();
            abortController.abort();
            error(new Error('aborted'));
            await flushMicrotasks();
            expect(store.getError()).toBeUndefined();
        });
    });
});
