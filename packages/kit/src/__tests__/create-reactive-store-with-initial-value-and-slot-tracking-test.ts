import type { PendingRpcRequest } from '@solana/rpc';
import type { PendingRpcSubscriptionsRequest } from '@solana/rpc-subscriptions';
import type { SolanaRpcResponse } from '@solana/rpc-types';

import { createReactiveStoreWithInitialValueAndSlotTracking } from '../create-reactive-store-with-initial-value-and-slot-tracking';

type TestValue = { count: number };

function createMockRpcRequest(): {
    mockRequest: PendingRpcRequest<SolanaRpcResponse<TestValue>>;
    reject(error: unknown): void;
    resolve(response: SolanaRpcResponse<TestValue>): void;
} {
    const { promise, resolve, reject } = Promise.withResolvers<SolanaRpcResponse<TestValue>>();
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
            reactiveStore: jest.fn().mockImplementation(() => {
                throw new Error('not implemented');
            }),
            subscribe: jest.fn().mockResolvedValue(asyncIterable),
        },
        pushNotification,
    };
}

function rpcResponse(slot: number, value: TestValue): SolanaRpcResponse<TestValue> {
    return { context: { slot: BigInt(slot) }, value };
}

jest.useFakeTimers();

describe('createReactiveStoreWithInitialValueAndSlotTracking', () => {
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
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            expect(store.getState()).toBeUndefined();
        });
        it('updates with the RPC response value', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 100n }, value: 42 });
        });
        it('updates with a subscription notification value', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            await jest.runAllTimersAsync();
            pushNotification(rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 100n }, value: 99 });
        });
        it('ignores the RPC response when a newer subscription notification has already arrived', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            await jest.runAllTimersAsync();
            pushNotification(rpcResponse(200, { count: 99 }));
            await jest.runAllTimersAsync();
            // RPC response arrives later at an older slot
            resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 200n }, value: 99 });
        });
        it('ignores a subscription notification when the RPC response was at a newer slot', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(200, { count: 42 }));
            await jest.runAllTimersAsync();
            pushNotification(rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 200n }, value: 42 });
        });
        it('preserves the last known value after an error', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            error(new Error('subscription failed'));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 100n }, value: 42 });
        });
    });

    describe('getError()', () => {
        it('returns `undefined` before any error', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            expect(store.getError()).toBeUndefined();
        });
        it('captures an error from the RPC request', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const error = new Error('rpc failed');
            reject(error);
            await jest.runAllTimersAsync();
            expect(store.getError()).toBe(error);
        });
        it('captures an error from the subscription', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            await jest.runAllTimersAsync();
            const subscriptionError = new Error('subscription failed');
            error(subscriptionError);
            await jest.runAllTimersAsync();
            expect(store.getError()).toBe(subscriptionError);
        });
        it('only captures the first error when RPC fails then subscription fails', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject: rejectRpc } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error: errorSubscription } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            await jest.runAllTimersAsync();
            rejectRpc(new Error('rpc error'));
            await jest.runAllTimersAsync();
            errorSubscription(new Error('subscription error'));
            await jest.runAllTimersAsync();
            expect(store.getError()).toEqual(new Error('rpc error'));
        });
        it('only captures the first error when subscription fails then RPC fails', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject: rejectRpc } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error: errorSubscription } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            await jest.runAllTimersAsync();
            errorSubscription(new Error('subscription error'));
            await jest.runAllTimersAsync();
            rejectRpc(new Error('rpc error'));
            await jest.runAllTimersAsync();
            expect(store.getError()).toEqual(new Error('subscription error'));
        });
    });

    describe('subscribe()', () => {
        it('calls the subscriber when the RPC response arrives', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('calls the subscriber when a subscription notification arrives', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            await jest.runAllTimersAsync();
            pushNotification(rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('does not call the subscriber when an out-of-order notification is skipped', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            resolve(rpcResponse(200, { count: 42 }));
            await jest.runAllTimersAsync();
            subscriber.mockClear();
            await jest.runAllTimersAsync();
            // This notification is at an older slot and should be skipped
            pushNotification(rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('calls the subscriber when an error occurs', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            reject(new Error('fail'));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('calls the subscriber when a subscription error occurs', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            await jest.runAllTimersAsync();
            error(new Error('fail'));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('stops calling the subscriber after unsubscribe', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            const unsubscribe = store.subscribe(subscriber);
            unsubscribe();
            resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('the unsubscribe function is idempotent', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
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
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const rpcSignal = (rpcRequest.send as jest.Mock).mock.calls[0][0].abortSignal;
            expect(rpcSignal.aborted).toBe(false);
            abortController.abort('test reason');
            expect(rpcSignal.aborted).toBe(true);
            expect(rpcSignal.reason).toBe('test reason');
        });
        it('aborts the signal passed to the subscription request when the caller aborts', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriptionSignal = (rpcSubscriptionRequest.subscribe as jest.Mock).mock.calls[0][0].abortSignal;
            expect(subscriptionSignal.aborted).toBe(false);
            abortController.abort('test reason');
            expect(subscriptionSignal.aborted).toBe(true);
            expect(subscriptionSignal.reason).toBe('test reason');
        });
        it('swallows errors from the RPC request when the caller aborts', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            abortController.abort();
            reject(new Error('aborted'));
            await jest.runAllTimersAsync();
            expect(store.getError()).toBeUndefined();
        });
        it('swallows errors from the subscription when the caller aborts', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            await jest.runAllTimersAsync();
            abortController.abort();
            error(new Error('aborted'));
            await jest.runAllTimersAsync();
            expect(store.getError()).toBeUndefined();
        });
        it('does not update state when the RPC response arrives after abort', async () => {
            expect.assertions(2);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            abortController.abort();
            resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toBeUndefined();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('does not update state when a subscription notification arrives after abort', async () => {
            expect.assertions(2);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            await jest.runAllTimersAsync();
            abortController.abort();
            pushNotification(rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toBeUndefined();
            expect(subscriber).not.toHaveBeenCalled();
        });
    });

    describe('getUnifiedState()', () => {
        it('starts in `loading` status', () => {
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'loading',
            });
        });
        it('transitions to `loaded` after the RPC response arrives', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 42 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('transitions to `error` on RPC failure, preserving nothing (no prior data)', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const failure = new Error('rpc failed');
            reject(failure);
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: failure,
                status: 'error',
            });
        });
        it('transitions to `error` on subscription failure, preserving the RPC value', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error } = createMockSubscriptionRequest();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            const failure = new Error('subscription failed');
            error(failure);
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 42 },
                error: failure,
                status: 'error',
            });
        });
    });

    describe('retry()', () => {
        // Helper: returns mocks where each invocation of rpcRequest.send() /
        // rpcSubscriptionRequest.subscribe() yields a fresh controllable instance — needed to
        // exercise retry, which re-invokes both.
        function createRetryableMocks() {
            const rpcInstances: {
                reject(error: unknown): void;
                resolve(response: SolanaRpcResponse<TestValue>): void;
            }[] = [];
            const subscriptionInstances: {
                error(err: unknown): void;
                pushNotification(notification: SolanaRpcResponse<TestValue>): void;
            }[] = [];
            const rpcRequest: PendingRpcRequest<SolanaRpcResponse<TestValue>> = {
                send: jest.fn().mockImplementation(() => {
                    const { promise, resolve, reject } = Promise.withResolvers<SolanaRpcResponse<TestValue>>();
                    rpcInstances.push({ reject, resolve });
                    return promise;
                }),
            };
            const rpcSubscriptionRequest: PendingRpcSubscriptionsRequest<SolanaRpcResponse<TestValue>> = {
                reactive: jest.fn().mockRejectedValue(new Error('not implemented')),
                reactiveStore: jest.fn().mockImplementation(() => {
                    throw new Error('not implemented');
                }),
                subscribe: jest.fn().mockImplementation(() => {
                    const instance = createMockSubscriptionRequest();
                    subscriptionInstances.push({
                        error: instance.error,
                        pushNotification: instance.pushNotification,
                    });
                    return (instance.mockRequest.subscribe as jest.Mock)();
                }),
            };
            return { rpcInstances, rpcRequest, rpcSubscriptionRequest, subscriptionInstances };
        }

        it('is a no-op when the store is not in error state', async () => {
            expect.assertions(1);
            const { rpcRequest, rpcSubscriptionRequest } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            await jest.runAllTimersAsync();
            store.retry();
            expect(rpcRequest.send).toHaveBeenCalledTimes(1);
        });
        it('transitions to `retrying` with preserved data and clears the error', async () => {
            expect.assertions(1);
            const { rpcInstances, rpcRequest, rpcSubscriptionRequest, subscriptionInstances } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            rpcInstances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            subscriptionInstances[0].error(new Error('stream died'));
            await jest.runAllTimersAsync();
            store.retry();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 42 },
                error: undefined,
                status: 'retrying',
            });
        });
        it('re-invokes the RPC request and subscription on retry', async () => {
            expect.assertions(2);
            const { rpcInstances, rpcRequest, rpcSubscriptionRequest } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            rpcInstances[0].reject(new Error('boom'));
            await jest.runAllTimersAsync();
            store.retry();
            await jest.runAllTimersAsync();
            expect(rpcRequest.send).toHaveBeenCalledTimes(2);
            expect(rpcSubscriptionRequest.subscribe).toHaveBeenCalledTimes(2);
        });
        it('recovers to `loaded` when the retried RPC succeeds', async () => {
            expect.assertions(1);
            const { rpcInstances, rpcRequest, rpcSubscriptionRequest } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            rpcInstances[0].reject(new Error('first failure'));
            await jest.runAllTimersAsync();
            store.retry();
            await jest.runAllTimersAsync();
            rpcInstances[1].resolve(rpcResponse(200, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 200n }, value: 99 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('transitions to `error` again when the retried RPC also fails', async () => {
            expect.assertions(1);
            const { rpcInstances, rpcRequest, rpcSubscriptionRequest } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            rpcInstances[0].reject(new Error('first'));
            await jest.runAllTimersAsync();
            store.retry();
            await jest.runAllTimersAsync();
            const secondFailure = new Error('second');
            rpcInstances[1].reject(secondFailure);
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: secondFailure,
                status: 'error',
            });
        });
        it('notifies subscribers on the retrying transition', async () => {
            expect.assertions(1);
            const { rpcInstances, rpcRequest, rpcSubscriptionRequest } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            rpcInstances[0].reject(new Error('fail'));
            await jest.runAllTimersAsync();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.retry();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('does not re-invoke the RPC request after the caller has aborted', async () => {
            expect.assertions(1);
            const { rpcInstances, rpcRequest, rpcSubscriptionRequest } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            rpcInstances[0].reject(new Error('fail'));
            await jest.runAllTimersAsync();
            abortController.abort();
            store.retry();
            await jest.runAllTimersAsync();
            expect(rpcRequest.send).toHaveBeenCalledTimes(1);
        });
        it('leaves the store in `error` state after the caller has aborted', async () => {
            expect.assertions(1);
            const { rpcInstances, rpcRequest, rpcSubscriptionRequest } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const failure = new Error('fail');
            rpcInstances[0].reject(failure);
            await jest.runAllTimersAsync();
            abortController.abort();
            store.retry();
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: failure,
                status: 'error',
            });
        });
        it('does not notify subscribers after the caller has aborted', async () => {
            expect.assertions(1);
            const { rpcInstances, rpcRequest, rpcSubscriptionRequest } = createRetryableMocks();
            const store = createReactiveStoreWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            rpcInstances[0].reject(new Error('fail'));
            await jest.runAllTimersAsync();
            abortController.abort();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.retry();
            await jest.runAllTimersAsync();
            expect(subscriber).not.toHaveBeenCalled();
        });
    });
});
