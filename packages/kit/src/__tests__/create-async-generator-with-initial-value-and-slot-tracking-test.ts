import type { PendingRpcRequest } from '@solana/rpc';
import type { PendingRpcSubscriptionsRequest } from '@solana/rpc-subscriptions';
import type { SolanaRpcResponse } from '@solana/rpc-types';

import { createAsyncGeneratorWithInitialValueAndSlotTracking } from '../create-async-generator-with-initial-value-and-slot-tracking';

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

/** Build the expected `{ context: { slot }, value }` shape for a yielded value. */
function expectedResponse(slot: number, value: number) {
    return { context: { slot: BigInt(slot) }, value };
}

/** Collect all values yielded by the generator until it's done (or collect `n` values). */
async function collectValues<T>(gen: AsyncGenerator<T>, n?: number): Promise<T[]> {
    const values: T[] = [];
    for await (const value of gen) {
        values.push(value);
        if (n !== undefined && values.length >= n) break;
    }
    return values;
}

describe('createAsyncGeneratorWithInitialValueAndSlotTracking', () => {
    let abortController: AbortController;

    beforeEach(() => {
        abortController = new AbortController();
    });

    afterEach(() => {
        abortController.abort();
    });

    describe('yielded values', () => {
        it('yields the RPC response value', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            const values = await collectValues(gen, 1);
            expect(values).toEqual([expectedResponse(100, 42)]);
        });
        it('yields subscription notification values', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            // Start consuming — the generator won't yield until a value arrives.
            const valuesPromise = collectValues(gen, 1);
            await flushMicrotasks();
            pushNotification(rpcResponse(100, { count: 99 }));
            const values = await valuesPromise;
            expect(values).toEqual([expectedResponse(100, 99)]);
        });
        it('yields values from both sources in order of arrival', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            const valuesPromise = collectValues(gen, 2);
            await flushMicrotasks();
            pushNotification(rpcResponse(200, { count: 99 }));
            const values = await valuesPromise;
            expect(values).toEqual([expectedResponse(100, 42), expectedResponse(200, 99)]);
        });
        it('silently drops the RPC response when a newer subscription notification has already arrived', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification, complete } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const valuesPromise = collectValues(gen);
            await flushMicrotasks();
            // Subscription notification arrives first at slot 200
            pushNotification(rpcResponse(200, { count: 99 }));
            await flushMicrotasks();
            // RPC response arrives later at older slot 100 — should be dropped
            resolve(rpcResponse(100, { count: 42 }));
            await flushMicrotasks();
            complete();
            const values = await valuesPromise;
            expect(values).toEqual([expectedResponse(200, 99)]);
        });
        it('silently drops a subscription notification when the RPC response was at a newer slot', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification, complete } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const valuesPromise = collectValues(gen);
            // RPC response arrives first at slot 200
            resolve(rpcResponse(200, { count: 42 }));
            await flushMicrotasks();
            // Subscription notification at older slot — should be dropped
            pushNotification(rpcResponse(100, { count: 99 }));
            await flushMicrotasks();
            complete();
            const values = await valuesPromise;
            expect(values).toEqual([expectedResponse(200, 42)]);
        });
        it('silently drops older subscription notifications while yielding newer ones', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification, complete } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const valuesPromise = collectValues(gen);
            await flushMicrotasks();
            pushNotification(rpcResponse(100, { count: 1 }));
            await flushMicrotasks();
            pushNotification(rpcResponse(300, { count: 3 }));
            await flushMicrotasks();
            // Slot 200 is older than 300 — should be dropped
            pushNotification(rpcResponse(200, { count: 2 }));
            await flushMicrotasks();
            pushNotification(rpcResponse(400, { count: 4 }));
            await flushMicrotasks();
            // Resolve RPC at old slot (dropped) so the generator can complete.
            resolve(rpcResponse(0, { count: 0 }));
            await flushMicrotasks();
            complete();
            const values = await valuesPromise;
            expect(values).toEqual([expectedResponse(100, 1), expectedResponse(300, 3), expectedResponse(400, 4)]);
        });
        it('buffers values that arrive while the consumer has not yet called next, then yields them', async () => {
            expect.assertions(4);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification, complete } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            // Start the generator — it enters the await.
            const firstNext = gen.next();
            await flushMicrotasks();
            // First notification resolves the waiting promise; the generator yields it.
            pushNotification(rpcResponse(100, { count: 1 }));
            await expect(firstNext).resolves.toEqual({ done: false, value: expectedResponse(100, 1) });
            // Generator is now suspended at the yield. Push more values — these
            // buffer into the internal queue because the consumer hasn't called next().
            pushNotification(rpcResponse(200, { count: 2 }));
            pushNotification(rpcResponse(300, { count: 3 }));
            await flushMicrotasks();
            // Consume — values should drain from the queue.
            await expect(gen.next()).resolves.toEqual({ done: false, value: expectedResponse(200, 2) });
            await expect(gen.next()).resolves.toEqual({ done: false, value: expectedResponse(300, 3) });
            // Resolve RPC at old slot (dropped) and complete subscription.
            resolve(rpcResponse(0, { count: 0 }));
            await flushMicrotasks();
            complete();
            await expect(gen.next()).resolves.toEqual({ done: true, value: undefined });
        });
    });

    describe('error handling', () => {
        it('throws when the RPC request fails', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, reject } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const error = new Error('rpc failed');
            reject(error);
            await expect(collectValues(gen)).rejects.toBe(error);
        });
        it('throws when the subscription fails', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const valuesPromise = collectValues(gen);
            await flushMicrotasks();
            const subscriptionError = new Error('subscription failed');
            error(subscriptionError);
            await expect(valuesPromise).rejects.toBe(subscriptionError);
        });
        it('throws the error even after yielding values', async () => {
            expect.assertions(2);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, error } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            // Collect one value, then wait for the next (which will be an error).
            const firstResult = await gen.next();
            expect(firstResult).toEqual({ done: false, value: expectedResponse(100, 42) });
            await flushMicrotasks();
            error(new Error('subscription failed'));
            await expect(gen.next()).rejects.toEqual(new Error('subscription failed'));
        });
    });

    describe('completion', () => {
        it('completes when the subscription ends', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, complete } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            const valuesPromise = collectValues(gen);
            await flushMicrotasks();
            complete();
            const values = await valuesPromise;
            expect(values).toEqual([expectedResponse(100, 42)]);
        });
        it('completes when both the subscription and RPC end while the consumer has not yet called next', async () => {
            expect.assertions(3);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification, complete } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            // Start the generator — it enters the await.
            const firstNext = gen.next();
            await flushMicrotasks();
            pushNotification(rpcResponse(100, { count: 1 }));
            await expect(firstNext).resolves.toEqual({ done: false, value: expectedResponse(100, 1) });
            // Resolve RPC at older slot (will be dropped) and complete the subscription.
            resolve(rpcResponse(50, { count: 0 }));
            await flushMicrotasks();
            complete();
            await flushMicrotasks();
            // Next call should see done=true and return.
            await expect(gen.next()).resolves.toEqual({ done: true, value: undefined });
            // Subsequent calls also return done.
            await expect(gen.next()).resolves.toEqual({ done: true, value: undefined });
        });
        it('yields the RPC response when the subscription ends before the RPC resolves', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, complete } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const valuesPromise = collectValues(gen);
            await flushMicrotasks();
            // Subscription ends before the RPC responds.
            complete();
            await flushMicrotasks();
            // RPC resolves after the subscription is already done.
            resolve(rpcResponse(100, { count: 42 }));
            const values = await valuesPromise;
            expect(values).toEqual([expectedResponse(100, 42)]);
        });
        it('does not complete until both the RPC and subscription have completed', async () => {
            expect.assertions(2);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest, pushNotification, complete } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const firstNext = gen.next();
            await flushMicrotasks();
            pushNotification(rpcResponse(100, { count: 1 }));
            await expect(firstNext).resolves.toEqual({ done: false, value: expectedResponse(100, 1) });
            // Complete the subscription — generator should NOT be done because RPC is pending.
            complete();
            await flushMicrotasks();
            // Resolve the RPC at a newer slot — should be yielded, then generator completes.
            resolve(rpcResponse(200, { count: 42 }));
            await expect(gen.next()).resolves.toEqual({ done: false, value: expectedResponse(200, 42) });
        });
        it('returns immediately if the abort signal is already aborted', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: AbortSignal.abort(),
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const values = await collectValues(gen);
            expect(values).toEqual([]);
        });
    });

    describe('abort signal', () => {
        it('completes without error when the abort signal fires', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const valuesPromise = collectValues(gen);
            await flushMicrotasks();
            abortController.abort();
            const values = await valuesPromise;
            expect(values).toEqual([]);
        });
        it('yields values received before abort, then completes', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            // Collect the first value.
            const firstResult = await gen.next();
            expect(firstResult).toEqual({ done: false, value: expectedResponse(100, 42) });
            abortController.abort();
        });
        it('does not yield values that arrive after abort', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const valuesPromise = collectValues(gen);
            await flushMicrotasks();
            abortController.abort();
            // RPC resolves after abort.
            resolve(rpcResponse(100, { count: 42 }));
            const values = await valuesPromise;
            expect(values).toEqual([]);
        });
        it('aborts the signal passed to the RPC request', async () => {
            expect.assertions(2);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const nextPromise = gen.next();
            const rpcSignal = (rpcRequest.send as jest.Mock).mock.calls[0][0].abortSignal;
            expect(rpcSignal.aborted).toBe(false);
            abortController.abort('test reason');
            expect(rpcSignal.aborted).toBe(true);
            await nextPromise;
        });
        it('aborts the signal passed to the subscription request', async () => {
            expect.assertions(2);
            const { mockRequest: rpcRequest } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            const nextPromise = gen.next();
            await flushMicrotasks();
            const subscriptionSignal = (rpcSubscriptionRequest.subscribe as jest.Mock).mock.calls[0][0].abortSignal;
            expect(subscriptionSignal.aborted).toBe(false);
            abortController.abort('test reason');
            expect(subscriptionSignal.aborted).toBe(true);
            await nextPromise;
        });
        it('cleans up when the consumer breaks out of the loop', async () => {
            expect.assertions(1);
            const { mockRequest: rpcRequest, resolve } = createMockRpcRequest();
            const { mockRequest: rpcSubscriptionRequest } = createMockSubscriptionRequest();
            const gen = createAsyncGeneratorWithInitialValueAndSlotTracking({
                abortSignal: abortController.signal,
                rpcRequest,
                rpcSubscriptionRequest,
                rpcSubscriptionValueMapper: v => v.count,
                rpcValueMapper: v => v.count,
            });
            resolve(rpcResponse(100, { count: 42 }));
            // Collect only 1 value (simulates breaking out of the loop).
            await collectValues(gen, 1);
            await flushMicrotasks();
            const rpcSignal = (rpcRequest.send as jest.Mock).mock.calls[0][0].abortSignal;
            expect(rpcSignal.aborted).toBe(true);
        });
    });
});
