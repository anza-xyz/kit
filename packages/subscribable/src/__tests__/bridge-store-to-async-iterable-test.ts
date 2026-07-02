import { isSolanaError, SOLANA_ERROR__SUBSCRIBABLE__STREAM_CLOSED_WITHOUT_ERROR } from '@solana/errors';

import { bridgeStoreToAsyncIterable } from '../bridge-store-to-async-iterable';
import type { ReactiveState, ReactiveStreamStore } from '../reactive-stream-store';

function createFakeStore<T>(): {
    emit: (state: ReactiveState<T>) => void;
    listenerCount: () => number;
    store: ReactiveStreamStore<T>;
} {
    let state: ReactiveState<T> = { data: undefined, error: undefined, status: 'idle' };
    const listeners = new Set<() => void>();
    const store: ReactiveStreamStore<T> = {
        // The bridge only *observes* the store — it must never drive its lifecycle. These throw so an
        // accidental call fails the test loudly rather than passing silently.
        connect: jest.fn().mockImplementation(() => {
            throw new Error('not implemented');
        }),
        getState: () => state,
        reset: jest.fn().mockImplementation(() => {
            throw new Error('not implemented');
        }),
        subscribe: (callback: () => void) => {
            listeners.add(callback);
            return () => {
                listeners.delete(callback);
            };
        },
        withSignal: jest.fn().mockImplementation(() => {
            throw new Error('not implemented');
        }),
    };
    return {
        // Before iteration begins there are no listeners, so `emit` doubles as a way to pre-seed the
        // store's snapshot (set state, notify nobody). After iteration it notifies the subscriber.
        emit: (next: ReactiveState<T>) => {
            state = next;
            listeners.forEach(l => l());
        },
        listenerCount: () => listeners.size,
        store,
    };
}

describe('bridgeStoreToAsyncIterable', () => {
    it('subscribes to the store on iteration without connecting or resetting it', () => {
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        // The generator body runs synchronously up to its first `await`, so subscribe has happened by
        // the time `next()` returns its (still-pending) promise. `connect` / `withSignal` / `reset`
        // are throwing stubs, so if the bridge touched the store's lifecycle this would throw.
        void it.next();
        expect(fake.listenerCount()).toBe(1);
    });

    it('yields a value already present when iteration begins', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        // A value the caller's own `connect()` already produced before it started iterating.
        fake.emit({ data: 5, error: undefined, status: 'loaded' });
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        await expect(it.next()).resolves.toEqual({ done: false, value: 5 });
    });

    it('throws an error already present when iteration begins', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        const boom = new Error('boom');
        fake.emit({ data: undefined, error: boom, status: 'error' });
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        await expect(it.next()).rejects.toBe(boom);
    });

    it('yields a loaded value', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        const pull = it.next();
        fake.emit({ data: 42, error: undefined, status: 'loaded' });
        await expect(pull).resolves.toEqual({ done: false, value: 42 });
    });

    it('yields successive loaded values across pulls', async () => {
        expect.assertions(2);
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();

        const first = it.next();
        fake.emit({ data: 1, error: undefined, status: 'loaded' });
        await expect(first).resolves.toEqual({ done: false, value: 1 });

        const second = it.next();
        fake.emit({ data: 2, error: undefined, status: 'loaded' });
        await expect(second).resolves.toEqual({ done: false, value: 2 });
    });

    it('drops intermediate values (latest-wins) when several land between pulls', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        const pull = it.next();
        // Three notifications arrive before the consumer pulls — only the freshest survives.
        fake.emit({ data: 1, error: undefined, status: 'loaded' });
        fake.emit({ data: 2, error: undefined, status: 'loaded' });
        fake.emit({ data: 3, error: undefined, status: 'loaded' });
        await expect(pull).resolves.toEqual({ done: false, value: 3 });
    });

    it('ignores idle and loading states', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        const pull = it.next();
        fake.emit({ data: undefined, error: undefined, status: 'loading' });
        fake.emit({ data: undefined, error: undefined, status: 'idle' });
        // Neither carried a value; the first *loaded* is what the consumer sees.
        fake.emit({ data: 7, error: undefined, status: 'loaded' });
        await expect(pull).resolves.toEqual({ done: false, value: 7 });
    });

    it('throws on a store error', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        const pull = it.next();
        const boom = new Error('boom');
        fake.emit({ data: undefined, error: boom, status: 'error' });
        await expect(pull).rejects.toBe(boom);
    });

    it('drops a buffered value when an error arrives before the next pull', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        const pull = it.next();
        // A value lands, then an error arrives before the consumer pulls again. Error wins: the
        // buffered value is dropped (once errored, stop yielding). Pins the failure-before-latest
        // precedence so a refactor can't silently invert it.
        const boom = new Error('boom');
        fake.emit({ data: 1, error: undefined, status: 'loaded' });
        fake.emit({ data: undefined, error: boom, status: 'error' });
        await expect(pull).rejects.toBe(boom);
    });

    it('substitutes a sentinel when the store errors with a nullish payload', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        const pull = it.next();
        fake.emit({ data: undefined, error: undefined, status: 'error' });
        await pull.then(
            () => {
                throw new Error('expected the pull to reject');
            },
            error => {
                expect(isSolanaError(error, SOLANA_ERROR__SUBSCRIBABLE__STREAM_CLOSED_WITHOUT_ERROR)).toBe(true);
            },
        );
    });

    it('ends cleanly and unsubscribes when the signal aborts', async () => {
        expect.assertions(2);
        const fake = createFakeStore<number>();
        const ctrl = new AbortController();
        const it = bridgeStoreToAsyncIterable(fake.store, ctrl.signal)[Symbol.asyncIterator]();
        const pull = it.next();
        ctrl.abort();
        // An abort is teardown, not failure: the iterable completes (`done`) rather than rejecting.
        await expect(pull).resolves.toEqual({ done: true, value: undefined });
        expect(fake.listenerCount()).toBe(0);
    });

    it('unsubscribes from the store when the consumer stops early', async () => {
        expect.assertions(1);
        const fake = createFakeStore<number>();
        const it = bridgeStoreToAsyncIterable(fake.store, new AbortController().signal)[Symbol.asyncIterator]();
        const pull = it.next();
        fake.emit({ data: 1, error: undefined, status: 'loaded' });
        await pull;

        await it.return!(undefined);
        expect(fake.listenerCount()).toBe(0);
    });
});
