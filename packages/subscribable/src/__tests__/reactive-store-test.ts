import { DataPublisher } from '../data-publisher';
import { createReactiveStoreFromDataPublisher } from '../reactive-store';

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
