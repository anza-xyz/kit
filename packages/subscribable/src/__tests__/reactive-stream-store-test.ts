import { DataPublisher } from '../data-publisher';
import { createReactiveStoreFromDataPublisherFactory } from '../reactive-stream-store';

jest.useFakeTimers();

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

    describe('initial state', () => {
        it('starts in `idle` status and does not invoke the factory before connect()', () => {
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'idle',
            });
            expect(mockRequest).not.toHaveBeenCalled();
        });
    });

    describe('connect()', () => {
        it('transitions from idle to `loading` and invokes the factory', () => {
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'loading',
            });
            expect(mockRequest).toHaveBeenCalledTimes(1);
        });
        it('transitions to `loaded` once the factory resolves and data arrives', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
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
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
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
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
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
        it('from `error`, transitions back through `loading` preserving stale data AND error (SWR)', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            const fail = new Error('fail');
            publishers[0].publish('error', fail);
            store.connect();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error: fail,
                status: 'loading',
            });
        });
        it('from `loaded`, transitions back through `loading` preserving the last value', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            store.connect();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error: undefined,
                status: 'loading',
            });
        });
        it('invokes the factory again on each connect()', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            store.connect();
            expect(mockRequest).toHaveBeenCalledTimes(2);
        });
        it('transitions back to `loaded` when the reconnected stream publishes a value', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            store.connect();
            await jest.runAllTimersAsync();
            publishers[1].publish('data', { value: 'recovered' });
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 'recovered' },
                error: undefined,
                status: 'loaded',
            });
        });
        it('notifies subscribers on the loaded → loading transition after reconnect', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('error', new Error('fail'));
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.connect();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('can recover from a factory-rejection error by calling connect() again', async () => {
            expect.assertions(2);
            const publisher = createMockDataPublisher();
            const mockRequest = jest
                .fn()
                .mockRejectedValueOnce(new Error('transient'))
                .mockResolvedValue(publisher.publisher);
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState().status).toBe('error');
            store.connect();
            await jest.runAllTimersAsync();
            publisher.publish('data', { value: 99 });
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 99 },
                error: undefined,
                status: 'loaded',
            });
        });
        it('transitions back to `error` when the reconnected factory rejects again', async () => {
            expect.assertions(1);
            const firstFailure = new Error('first');
            const secondFailure = new Error('second');
            const mockRequest = jest.fn().mockRejectedValueOnce(firstFailure).mockRejectedValue(secondFailure);
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            store.connect();
            await jest.runAllTimersAsync();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: secondFailure,
                status: 'error',
            });
        });
        it('stays in `loading` when called again before the first connection resolves', () => {
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            store.connect();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'loading',
            });
            expect(mockRequest).toHaveBeenCalledTimes(2);
        });
        it('does not notify subscribers on the loading → loading re-entry', () => {
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.connect();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('aborts the prior connection when called again before data arrives', async () => {
            expect.assertions(2);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            const firstSignal = publishers[0].mockOn.mock.calls.find(([channel]: [string]) => channel === 'data')![2]
                .signal;
            expect(firstSignal.aborted).toBe(false);
            store.connect();
            expect(firstSignal.aborted).toBe(true);
        });
    });

    describe('reset()', () => {
        it('returns to `idle` and clears prior data', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            store.reset();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'idle',
            });
        });
        it('aborts the in-flight connection', async () => {
            expect.assertions(2);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            const listenerSignal = publishers[0].mockOn.mock.calls.find(([channel]: [string]) => channel === 'data')![2]
                .signal;
            expect(listenerSignal.aborted).toBe(false);
            store.reset();
            expect(listenerSignal.aborted).toBe(true);
        });
        it('notifies subscribers when state changes from non-idle', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.reset();
            expect(subscriber).toHaveBeenCalledTimes(1);
        });
        it('is a no-op when already idle (subscribers not notified)', () => {
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.reset();
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('allows a follow-up connect() to open a fresh stream', async () => {
            expect.assertions(2);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            store.reset();
            store.connect();
            await jest.runAllTimersAsync();
            publishers[1].publish('data', { value: 'fresh' });
            expect(mockRequest).toHaveBeenCalledTimes(2);
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 'fresh' },
                error: undefined,
                status: 'loaded',
            });
        });
    });

    describe('retry() (deprecated)', () => {
        it('is a no-op when the store is not in `error` state', async () => {
            expect.assertions(2);
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            const callsBefore = mockRequest.mock.calls.length;
            store.retry();
            expect(mockRequest).toHaveBeenCalledTimes(callsBefore);
            expect(store.getUnifiedState().status).toBe('loading');
        });
        it('transitions back to `loading` from `error`, preserving stale data and error (SWR)', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            const fail = new Error('fail');
            publishers[0].publish('error', fail);
            store.retry();
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error: fail,
                status: 'loading',
            });
        });
    });

    describe('subscribe()', () => {
        it('stops calling the subscriber after the returned unsubscribe is called', async () => {
            expect.assertions(1);
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.connect();
            await jest.runAllTimersAsync();
            const subscriber = jest.fn();
            const unsubscribe = store.subscribe(subscriber);
            unsubscribe();
            publishers[0].publish('data', { value: 1 });
            expect(subscriber).not.toHaveBeenCalled();
        });
        it('the unsubscribe function is idempotent', () => {
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            const unsubscribe = store.subscribe(jest.fn());
            expect(() => {
                unsubscribe();
                unsubscribe();
            }).not.toThrow();
        });
    });

    describe('withSignal()', () => {
        it('forwards a non-aborted composed signal to the data publisher listeners', async () => {
            expect.assertions(1);
            const abortController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.withSignal(abortController.signal).connect();
            await jest.runAllTimersAsync();
            const dataSignal = publishers[0].mockOn.mock.calls.find(([channel]: [string]) => channel === 'data')![2]
                .signal;
            expect(dataSignal.aborted).toBe(false);
        });
        it('aborts the listener signal when the caller signal aborts', async () => {
            expect.assertions(2);
            const abortController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.withSignal(abortController.signal).connect();
            await jest.runAllTimersAsync();
            const dataSignal = publishers[0].mockOn.mock.calls.find(([channel]: [string]) => channel === 'data')![2]
                .signal;
            expect(dataSignal.aborted).toBe(false);
            abortController.abort();
            expect(dataSignal.aborted).toBe(true);
        });
        it('transitions the store to `error` with the caller signal abort reason', () => {
            const abortController = new AbortController();
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.withSignal(abortController.signal).connect();
            const reason = new Error('timed out');
            abortController.abort(reason);
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: reason,
                status: 'error',
            });
        });
        it('preserves prior data when the caller signal aborts mid-stream', async () => {
            expect.assertions(1);
            const abortController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.withSignal(abortController.signal).connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 42 });
            const reason = new Error('timed out');
            abortController.abort(reason);
            expect(store.getUnifiedState()).toStrictEqual({
                data: { value: 42 },
                error: reason,
                status: 'error',
            });
        });
        it('when the caller signal is already aborted, transitions to error without invoking the factory', () => {
            const abortController = new AbortController();
            const reason = new Error('pre-aborted');
            abortController.abort(reason);
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.withSignal(abortController.signal).connect();
            expect(mockRequest).not.toHaveBeenCalled();
            expect(store.getUnifiedState()).toStrictEqual({
                data: undefined,
                error: reason,
                status: 'error',
            });
        });
        it('a bound wrapper reused across calls — kill-switch pattern', async () => {
            expect.assertions(3);
            const killController = new AbortController();
            const { mockRequest, publishers } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            const killable = store.withSignal(killController.signal);
            killable.connect();
            await jest.runAllTimersAsync();
            publishers[0].publish('data', { value: 'first' });
            // Re-connect via the same wrapper.
            killable.connect();
            await jest.runAllTimersAsync();
            expect(mockRequest).toHaveBeenCalledTimes(2);
            // Once killed, subsequent calls short-circuit to error.
            const reason = new Error('kill');
            killController.abort(reason);
            killable.connect();
            expect(mockRequest).toHaveBeenCalledTimes(2);
            expect(store.getUnifiedState().status).toBe('error');
        });
        it('does not abort the listener signal on supersede via a fresh connect()', async () => {
            expect.assertions(1);
            const abortController = new AbortController();
            const { mockRequest } = createFactory();
            const store = createReactiveStoreFromDataPublisherFactory({
                createDataPublisher: mockRequest,
                dataChannelName: 'data',
                errorChannelName: 'error',
            });
            store.withSignal(abortController.signal).connect();
            await jest.runAllTimersAsync();
            // Bare connect() aborts the prior inner connection but leaves the caller signal alone.
            store.connect();
            expect(abortController.signal.aborted).toBe(false);
        });
    });
});
