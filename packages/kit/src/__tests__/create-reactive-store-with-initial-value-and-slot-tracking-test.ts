import type { SolanaRpcResponse } from '@solana/rpc-types';
import {
    createReactiveActionStore,
    createReactiveStoreFromDataPublisherFactory,
    ReactiveActionSource,
    ReactiveStreamSource,
} from '@solana/subscribable';

import { createReactiveStoreWithInitialValueAndSlotTracking } from '../create-reactive-store-with-initial-value-and-slot-tracking';

type TestValue = { count: number };

// Backs the `initialValueSource` with a real `ReactiveActionStore`. The wrapped function hands out
// a fresh controllable promise on every dispatch, so a retry (which builds a new store and
// dispatches again) gets its own instance. `instances[i]` captures the resolve/reject and the
// per-dispatch signal for the i-th dispatch.
function createMockInitialValueSource(): {
    fn: jest.Mock;
    instances: {
        reject(error: unknown): void;
        resolve(response: SolanaRpcResponse<TestValue>): void;
        signal: AbortSignal | undefined;
    }[];
    source: ReactiveActionSource<SolanaRpcResponse<TestValue>>;
} {
    const instances: {
        reject(error: unknown): void;
        resolve(response: SolanaRpcResponse<TestValue>): void;
        signal: AbortSignal | undefined;
    }[] = [];
    const fn = jest.fn().mockImplementation((signal?: AbortSignal) => {
        const { promise, resolve, reject } = Promise.withResolvers<SolanaRpcResponse<TestValue>>();
        instances.push({ reject, resolve, signal });
        return promise;
    });
    const source: ReactiveActionSource<SolanaRpcResponse<TestValue>> = {
        reactiveStore: () => createReactiveActionStore(fn),
    };
    return { fn, instances, source };
}

// Backs the `streamSource` with a real `ReactiveStreamStore` built from a mock `DataPublisher`
// factory. The factory hands out a fresh publisher per connection, so a retry gets its own
// instance. `publishers[i]` lets the test publish data/error onto the i-th connection and exposes
// the per-connection signal.
function createMockStreamSource(): {
    createDataPublisher: jest.Mock;
    publishers: { publish(channel: string, payload: unknown): void; signal: AbortSignal | undefined }[];
    source: ReactiveStreamSource<SolanaRpcResponse<TestValue>>;
} {
    const publishers: { publish(channel: string, payload: unknown): void; signal: AbortSignal | undefined }[] = [];
    const createDataPublisher = jest.fn().mockImplementation((signal?: AbortSignal) => {
        const mockOn = jest.fn().mockReturnValue(function unsubscribe() {});
        publishers.push({
            publish(channel: string, payload: unknown) {
                mockOn.mock.calls
                    .filter(
                        ([actualChannel, , options]: [string, unknown, { signal?: AbortSignal } | undefined]) =>
                            actualChannel === channel && !options?.signal?.aborted,
                    )
                    .forEach(([, listener]) => listener(payload));
            },
            signal,
        });
        return Promise.resolve({ on: mockOn });
    });
    const source: ReactiveStreamSource<SolanaRpcResponse<TestValue>> = {
        reactiveStore: () =>
            createReactiveStoreFromDataPublisherFactory<SolanaRpcResponse<TestValue>>({
                createDataPublisher,
                dataChannelName: 'data',
                errorChannelName: 'error',
            }),
    };
    return { createDataPublisher, publishers, source };
}

function rpcResponse(slot: number, value: TestValue): SolanaRpcResponse<TestValue> {
    return { context: { slot: BigInt(slot) }, value };
}

function createStore(
    initialValueSource: ReactiveActionSource<SolanaRpcResponse<TestValue>>,
    streamSource: ReactiveStreamSource<SolanaRpcResponse<TestValue>>,
) {
    return createReactiveStoreWithInitialValueAndSlotTracking({
        initialValueMapper: (v: TestValue) => v.count,
        initialValueSource,
        streamSource,
        streamValueMapper: (v: TestValue) => v.count,
    });
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
            const { source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            expect(store.getState()).toBeUndefined();
        });
        it('updates with the initial-value source response', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 100n }, value: 42 });
        });
        it('updates with a stream notification value', async () => {
            expect.assertions(1);
            const { source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 100n }, value: 99 });
        });
        it('ignores the initial value when a newer stream notification has already arrived', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', rpcResponse(200, { count: 99 }));
            await jest.runAllTimersAsync();
            // Initial value arrives later at an older slot
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 200n }, value: 99 });
        });
        it('ignores a stream notification when the initial value was at a newer slot', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].resolve(rpcResponse(200, { count: 42 }));
            await jest.runAllTimersAsync();
            publishers[0].publish('data', rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 200n }, value: 42 });
        });
        it('preserves the last known value after an error', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('stream failed'));
            await jest.runAllTimersAsync();
            expect(store.getState()).toEqual({ context: { slot: 100n }, value: 42 });
        });
    });

    describe('getError()', () => {
        it('returns `undefined` before any error', () => {
            const { source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            expect(store.getError()).toBeUndefined();
        });
        it('captures an error from the initial-value source', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const error = new Error('initial value failed');
            instances[0].reject(error);
            await jest.runAllTimersAsync();
            expect(store.getError()).toBe(error);
        });
        it('captures an error from the stream', async () => {
            expect.assertions(1);
            const { source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            const streamError = new Error('stream failed');
            publishers[0].publish('error', streamError);
            await jest.runAllTimersAsync();
            expect(store.getError()).toBe(streamError);
        });
        it('only captures the first error when the initial value fails then the stream fails', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            instances[0].reject(new Error('initial value error'));
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('stream error'));
            await jest.runAllTimersAsync();
            expect(store.getError()).toEqual(new Error('initial value error'));
        });
        it('only captures the first error when the stream fails then the initial value fails', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('stream error'));
            await jest.runAllTimersAsync();
            instances[0].reject(new Error('initial value error'));
            await jest.runAllTimersAsync();
            expect(store.getError()).toEqual(new Error('stream error'));
        });
    });

    describe('subscribe()', () => {
        it('calls the subscriber when the initial value arrives', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('calls the subscriber when a stream notification arrives', async () => {
            expect.assertions(1);
            const { source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            await jest.runAllTimersAsync();
            publishers[0].publish('data', rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('does not call the subscriber when an out-of-order notification is skipped', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            instances[0].resolve(rpcResponse(200, { count: 42 }));
            await jest.runAllTimersAsync();
            subscriber.mockClear();
            // This notification is at an older slot and should be skipped
            publishers[0].publish('data', rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('calls the subscriber when an error occurs', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            instances[0].reject(new Error('fail'));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('calls the subscriber when a stream error occurs', async () => {
            expect.assertions(1);
            const { source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('stops calling the subscriber after unsubscribe', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const subscriber = jest.fn();
            const unsubscribe = store.subscribe(subscriber);
            unsubscribe();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('the unsubscribe function is idempotent', () => {
            const { source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const unsubscribe = store.subscribe(jest.fn());
            expect(() => {
                unsubscribe();
                unsubscribe();
            }).not.toThrow();
        });
    });

    describe('withSignal()', () => {
        it('forwards the composed signal to the initial-value source', () => {
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.withSignal(abortController.signal).connect();
            const signal = instances[0].signal!;
            expect(signal.aborted).toBe(false);
            abortController.abort('test reason');
            expect(signal.aborted).toBe(true);
            expect(signal.reason).toBe('test reason');
        });
        it('forwards the composed signal to the stream source', () => {
            const { source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.withSignal(abortController.signal).connect();
            const signal = publishers[0].signal!;
            expect(signal.aborted).toBe(false);
            abortController.abort('test reason');
            expect(signal.aborted).toBe(true);
            expect(signal.reason).toBe('test reason');
        });
        it('transitions to `error` with the caller signal abort reason', () => {
            const { source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.withSignal(abortController.signal).connect();
            const reason = new Error('timed out');
            abortController.abort(reason);
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: reason,
                status: 'error',
            });
        });
        it('does not overwrite the abort-reason error with a late initial-value rejection', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.withSignal(abortController.signal).connect();
            const reason = new Error('cancelled');
            abortController.abort(reason);
            instances[0].reject(new Error('late'));
            await jest.runAllTimersAsync();
            expect(store.getError()).toBe(reason);
        });
        it('does not update state when the initial value arrives after abort', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.withSignal(abortController.signal).connect();
            abortController.abort();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toBeUndefined();
        });
        it('does not update state when a stream notification arrives after abort', async () => {
            expect.assertions(1);
            const { source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.withSignal(abortController.signal).connect();
            await jest.runAllTimersAsync();
            abortController.abort();
            publishers[0].publish('data', rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getState()).toBeUndefined();
        });
    });

    describe('getUnifiedState()', () => {
        it('starts in `loading` status', () => {
            const { source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'loading',
            });
        });
        it('transitions to `loaded` after the initial value arrives', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 42 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('transitions to `error` on initial-value failure, preserving nothing (no prior data)', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            const failure = new Error('initial value failed');
            instances[0].reject(failure);
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: failure,
                status: 'error',
            });
        });
        it('transitions to `error` on stream failure, preserving the initial value', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            const failure = new Error('stream failed');
            publishers[0].publish('error', failure);
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 42 },
                error: failure,
                status: 'error',
            });
        });
        it('transitions to `loaded` after a stream notification arrives', async () => {
            expect.assertions(1);
            const { source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 99 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('keeps the newer stream value when an older initial value arrives later', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', rpcResponse(200, { count: 99 }));
            await jest.runAllTimersAsync();
            // Initial value arrives later at an older slot and should be ignored
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 200n }, value: 99 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('keeps the newer initial value when an older stream notification arrives later', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].resolve(rpcResponse(200, { count: 42 }));
            await jest.runAllTimersAsync();
            // Stream notification arrives at an older slot and should be ignored
            publishers[0].publish('data', rpcResponse(100, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 200n }, value: 42 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('captures only the first error when the initial value fails then the stream fails', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            const firstError = new Error('initial value error');
            instances[0].reject(firstError);
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('stream error'));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: firstError,
                status: 'error',
            });
        });
        it('captures only the first error when the stream fails then the initial value fails', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            const firstError = new Error('stream error');
            publishers[0].publish('error', firstError);
            await jest.runAllTimersAsync();
            instances[0].reject(new Error('initial value error'));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: firstError,
                status: 'error',
            });
        });
    });

    describe('retry()', () => {
        it('is a no-op when the store is not in error state', async () => {
            expect.assertions(1);
            const { fn, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            await jest.runAllTimersAsync();
            store.retry();
            expect(fn).toHaveBeenCalledTimes(1);
        });
        it('transitions back to `loading` with preserved data AND error (SWR)', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            const fail = new Error('stream died');
            publishers[0].publish('error', fail);
            await jest.runAllTimersAsync();
            store.retry();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 42 },
                error: fail,
                status: 'loading',
            });
        });
        it('re-builds both inner stores on retry', async () => {
            expect.assertions(2);
            const { fn, instances, source: initialValueSource } = createMockInitialValueSource();
            const { createDataPublisher, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].reject(new Error('boom'));
            await jest.runAllTimersAsync();
            store.retry();
            await jest.runAllTimersAsync();
            expect(fn).toHaveBeenCalledTimes(2);
            expect(createDataPublisher).toHaveBeenCalledTimes(2);
        });
        it('recovers to `loaded` when the retried initial value succeeds', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].reject(new Error('first failure'));
            await jest.runAllTimersAsync();
            store.retry();
            await jest.runAllTimersAsync();
            instances[1].resolve(rpcResponse(200, { count: 99 }));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 200n }, value: 99 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('transitions to `error` again when the retried initial value also fails', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].reject(new Error('first'));
            await jest.runAllTimersAsync();
            store.retry();
            await jest.runAllTimersAsync();
            const secondFailure = new Error('second');
            instances[1].reject(secondFailure);
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: secondFailure,
                status: 'error',
            });
        });
        it('notifies subscribers on the error → loading transition after retry', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].reject(new Error('fail'));
            await jest.runAllTimersAsync();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.retry();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
    });

    // `lastUpdateSlot` persists across `connect()` windows so the surfaced value never regresses.
    // But a fresh connect window must still be able to *settle* `loading` when a source answers
    // successfully — even at an older slot — otherwise a refresh answered by a lagging node leaves
    // a quiet account (whose subscription emits nothing) stuck in `loading` forever.
    describe('reconnecting after a value was already loaded', () => {
        it('settles to `loaded` with the retained newer data when a stale-slot initial value arrives on the new window', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            // Window 1: settle at slot 100.
            store.connect();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            // Window 2 (refresh): a lagging node answers the re-fetch at an older slot, and the
            // quiet account's subscription emits nothing — so this stale value is the only proof
            // of liveness.
            store.connect();
            instances[1].resolve(rpcResponse(99, { count: 7 }));
            await jest.runAllTimersAsync();
            // The store must leave `loading`, retaining the newer slot-100 data rather than
            // regressing to the stale slot-99 value.
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 42 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('settles to `loaded` with the retained newer data when a stale-slot stream notification arrives on the new window', async () => {
            expect.assertions(1);
            const { source: initialValueSource } = createMockInitialValueSource();
            const { publishers, source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            // Window 1: settle at slot 100 via a stream notification.
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            // Window 2 (refresh): the new subscription replays an older slot before catching up.
            store.connect();
            await jest.runAllTimersAsync();
            publishers[1].publish('data', rpcResponse(99, { count: 7 }));
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { context: { slot: 100n }, value: 42 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('notifies subscribers when a stale-slot value settles the new window back to `loaded`', async () => {
            expect.assertions(1);
            const { instances, source: initialValueSource } = createMockInitialValueSource();
            const { source: streamSource } = createMockStreamSource();
            const store = createStore(initialValueSource, streamSource);
            store.connect();
            instances[0].resolve(rpcResponse(100, { count: 42 }));
            await jest.runAllTimersAsync();
            store.connect();
            await jest.runAllTimersAsync();
            // Subscribe after the `loaded → loading` reconnect transition so we only observe the
            // settle caused by the stale value.
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            instances[1].resolve(rpcResponse(99, { count: 7 }));
            await jest.runAllTimersAsync();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
    });
});
