import { SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import { DataPublisher } from '../data-publisher';
import {
    createReactiveStoreFromDataPublisher,
    createReactiveStoreFromDataPublisherFactory,
} from '../reactive-stream-store';

jest.useFakeTimers();

describe('createReactiveStoreFromDataPublisher', () => {
    let mockDataPublisher: DataPublisher;
    let mockOn: jest.Mock;
    function publish(type: string, payload: unknown) {
        mockOn.mock.calls.filter(([actualType]) => actualType === type).forEach(([_, listener]) => listener(payload));
    }
    beforeEach(() => {
        mockOn = jest.fn().mockReturnValue(function unsubscribe() {});
        mockDataPublisher = {
            on: mockOn,
        };
    });

    describe('getState()', () => {
        it('returns `undefined` before any notification arrives', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            expect(store.getState()).toBeUndefined();
        });
        it('returns the latest notification after one arrives', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            publish('data', { value: 42 });
            expect(store.getState()).toStrictEqual({ value: 42 });
        });
        it('returns the most recent notification when multiple arrive', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            publish('data', { value: 1 });
            publish('data', { value: 2 });
            publish('data', { value: 3 });
            expect(store.getState()).toStrictEqual({ value: 3 });
        });
        it('preserves the last known value after an error', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            publish('data', { value: 42 });
            publish('error', new Error('o no'));
            expect(store.getState()).toStrictEqual({ value: 42 });
        });
        it('returns `undefined` after an error when no notification has arrived', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            publish('error', new Error('o no'));
            expect(store.getState()).toBeUndefined();
        });
    });

    describe('getError()', () => {
        it('returns `undefined` before any error', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            expect(store.getError()).toBeUndefined();
        });
        it('returns the error after one arrives', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const error = new Error('o no');
            publish('error', error);
            expect(store.getError()).toBe(error);
        });
        it('preserves the first error when multiple errors arrive', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const firstError = new Error('first');
            const secondError = new Error('second');
            publish('error', firstError);
            publish('error', secondError);
            expect(store.getError()).toBe(firstError);
        });
        it('remains `undefined` when only data notifications arrive', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            publish('data', { value: 1 });
            publish('data', { value: 2 });
            expect(store.getError()).toBeUndefined();
        });
    });

    describe('getUnifiedState()', () => {
        it('starts in `loading` status with no data or error', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'loading',
            });
        });
        it('transitions to `loaded` with the value when a notification arrives', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            publish('data', { value: 42 });
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('transitions to `error` preserving the last known value', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const error = new Error('o no');
            publish('data', { value: 42 });
            publish('error', error);
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error,
                status: 'error',
            });
        });
        it('transitions to `error` with undefined data when no value arrived first', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const error = new Error('o no');
            publish('error', error);
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error,
                status: 'error',
            });
        });
    });

    describe('retry()', () => {
        it('throws a SolanaError because a raw DataPublisher cannot be restarted', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            expect(() => store.retry()).toThrow(new SolanaError(SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED));
        });
    });

    describe('subscribe()', () => {
        it('calls the subscriber when a notification arrives', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            publish('data', { value: 1 });
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('calls the subscriber on each new notification', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            publish('data', { value: 1 });
            publish('data', { value: 2 });
            publish('data', { value: 3 });
            expect(subscriber).toHaveBeenCalledTimes(3);
        });
        it('calls the subscriber when an error arrives', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            publish('error', new Error('o no'));
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('does not notify subscribers on subsequent errors', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            publish('error', new Error('first'));
            publish('error', new Error('second'));
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('calls multiple concurrent subscribers on each notification', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const subscriberA = jest.fn();
            const subscriberB = jest.fn();
            store.subscribe(subscriberA);
            store.subscribe(subscriberB);
            publish('data', { value: 1 });
            expect(subscriberA).toHaveBeenCalledTimes(1);
            expect(subscriberB).toHaveBeenCalledTimes(1);
        });
        it('stops calling the subscriber after the returned unsubscribe is called', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const subscriber = jest.fn();
            const unsubscribe = store.subscribe(subscriber);
            unsubscribe();
            publish('data', { value: 1 });
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('only unsubscribes the subscriber whose unsubscribe function was called', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const subscriberA = jest.fn();
            const subscriberB = jest.fn();
            const unsubscribeA = store.subscribe(subscriberA);
            store.subscribe(subscriberB);
            unsubscribeA();
            publish('data', { value: 1 });
            expect(subscriberA).not.toHaveBeenCalled();
            expect(subscriberB).toHaveBeenCalledTimes(1);
        });
        it('the unsubscribe function is idempotent', () => {
            const store = createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const unsubscribe = store.subscribe(jest.fn());
            expect(() => {
                unsubscribe();
                unsubscribe();
            }).not.toThrow();
        });
    });

    describe('abort signal', () => {
        it('aborts the signals forwarded to dataPublisher.on() when the caller aborts', () => {
            const abortController = new AbortController();
            createReactiveStoreFromDataPublisher({
                abortSignal: abortController.signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const dataChannelSignal = mockOn.mock.calls.find(([type]: [string]) => type === 'data')![2].signal;
            const errorChannelSignal = mockOn.mock.calls.find(([type]: [string]) => type === 'error')![2].signal;
            expect(dataChannelSignal.aborted).toBe(false);
            expect(errorChannelSignal.aborted).toBe(false);
            const reason = new Error('go away');
            abortController.abort(reason);
            expect(dataChannelSignal.aborted).toBe(true);
            expect(dataChannelSignal.reason).toBe(reason);
            expect(errorChannelSignal.aborted).toBe(true);
            expect(errorChannelSignal.reason).toBe(reason);
        });
        it('aborts the signals forwarded to dataPublisher.on() when an error arrives', () => {
            createReactiveStoreFromDataPublisher({
                abortSignal: new AbortController().signal,
                dataChannelName: 'data',
                dataPublisher: mockDataPublisher,
                errorChannelName: 'error',
            });
            const dataChannelSignal = mockOn.mock.calls.find(([type]: [string]) => type === 'data')![2].signal;
            const errorChannelSignal = mockOn.mock.calls.find(([type]: [string]) => type === 'error')![2].signal;
            expect(dataChannelSignal.aborted).toBe(false);
            expect(errorChannelSignal.aborted).toBe(false);
            const error = new Error('o no');
            publish('error', error);
            expect(dataChannelSignal.aborted).toBe(true);
            expect(dataChannelSignal.reason).toBe(error);
            expect(errorChannelSignal.aborted).toBe(true);
            expect(errorChannelSignal.reason).toBe(error);
        });
    });
});

describe('createReactiveStoreFromDataPublisherFactory', () => {
    function createMockDataPublisher(): {
        mockOn: jest.Mock;
        publish(channel: string, payload: unknown): void;
        publisher: DataPublisher;
    } {
        const mockOn = jest.fn().mockReturnValue(function unsubscribe() {});
        return {
            mockOn,
            publish(channel: string, payload: unknown) {
                mockOn.mock.calls
                    .filter(
                        ([actualChannel, , options]: [string, unknown, { signal?: AbortSignal } | undefined]) =>
                            actualChannel === channel && !options?.signal?.aborted,
                    )
                    .forEach(([_, listener]) => listener(payload));
            },
            publisher: { on: mockOn },
        };
    }

    // Helper: returns a factory that hands out a fresh mock DataPublisher per invocation, plus
    // a parallel array of those publishers for test assertions.
    function createFactory() {
        const publishers: ReturnType<typeof createMockDataPublisher>[] = [];
        const mockRequest = jest.fn().mockImplementation(() => {
            const p = createMockDataPublisher();
            publishers.push(p);
            return Promise.resolve(p.publisher);
        });
        return { mockRequest, publishers };
    }

    describe('initial connection', () => {
        it('starts in `loading` before the factory resolves', () => {
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'loading',
            });
        });
        it('transitions to `loaded` once the factory resolves and data arrives', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('transitions to `error` when the factory rejects', async () => {
            expect.assertions(1);
            const failure = new Error('connection refused');
            const mockRequest = jest.fn().mockRejectedValue(failure);
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: failure,
                status: 'error',
            });
        });
        it('transitions to `error` on an error channel message, preserving the last known value', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            const failure = new Error('stream died');
            publishers[0].publish('error', failure);
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error: failure,
                status: 'error',
            });
        });
    });

    describe('retry()', () => {
        it('is a no-op when the store is not in `error` state', async () => {
            expect.assertions(2);
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            const callsBefore = mockRequest.mock.calls.length;
            store.retry();
            expect(mockRequest).toHaveBeenCalledTimes(callsBefore);
            expect(store.getUnifiedState().status).toBe('loading');
        });
        it('transitions to `retrying` and preserves stale data', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            publishers[0].publish('error', new Error('fail'));
            store.retry();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error: undefined,
                status: 'retrying',
            });
        });
        it('invokes the factory a second time', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            store.retry();
            expect(mockRequest).toHaveBeenCalledTimes(2);
        });
        it('transitions back to `loaded` when the retried stream publishes a value', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            store.retry();
            await jest.runAllTimersAsync();
            publishers[1].publish('data', { value: 'recovered' });
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 'recovered' },
                error: undefined,
                status: 'loaded',
            });
        });
        it('notifies subscribers on the retrying transition', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.retry();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('can recover from a factory-rejection error by retrying', async () => {
            expect.assertions(2);
            const publisher = createMockDataPublisher();
            const mockRequest = jest
                .fn()
                .mockRejectedValueOnce(new Error('transient'))
                .mockResolvedValue(publisher.publisher);
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState().status).toBe('error');
            store.retry();
            await jest.runAllTimersAsync();
            publisher.publish('data', { value: 99 });
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 99 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('transitions back to `error` when the retried factory rejects again', async () => {
            expect.assertions(1);
            const firstFailure = new Error('first');
            const secondFailure = new Error('second');
            const mockRequest = jest.fn().mockRejectedValueOnce(firstFailure).mockRejectedValue(secondFailure);
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: new AbortController().signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            store.retry();
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: secondFailure,
                status: 'error',
            });
        });
    });

    describe('abort signal', () => {
        it('prevents further state updates once the caller aborts', async () => {
            expect.assertions(1);
            const abortController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: abortController.signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            abortController.abort();
            publishers[0].publish('data', { value: 'late' });
            expect(store.getUnifiedState().status).toBe('loading');
        });
        it('aborts the signal forwarded to the inner DataPublisher listeners', async () => {
            expect.assertions(2);
            const abortController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            createReactiveStoreFromDataPublisherFactory({
                abortSignal: abortController.signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            const dataSignal = publishers[0].mockOn.mock.calls.find(([channel]: [string]) => channel === 'data')![2]
                .signal;
            expect(dataSignal.aborted).toBe(false);
            abortController.abort();
            expect(dataSignal.aborted).toBe(true);
        });
        it('retry() after abort does not re-invoke the factory', async () => {
            expect.assertions(1);
            const abortController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: abortController.signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            abortController.abort();
            const callsBefore = mockRequest.mock.calls.length;
            store.retry();
            await jest.runAllTimersAsync();
            expect(mockRequest).toHaveBeenCalledTimes(callsBefore);
        });
        it('retry() after abort leaves the store in `error` state', async () => {
            expect.assertions(1);
            const abortController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: abortController.signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            const failure = new Error('fail');
            publishers[0].publish('error', failure);
            abortController.abort();
            store.retry();
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: failure,
                status: 'error',
            });
        });
        it('retry() after abort does not notify subscribers', async () => {
            expect.assertions(1);
            const abortController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                abortSignal: abortController.signal,
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            abortController.abort();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.retry();
            await jest.runAllTimersAsync();
            expect(subscriber).not.toHaveBeenCalled();
        });
    });
});
