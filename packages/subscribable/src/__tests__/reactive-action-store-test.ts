import { createReactiveActionStore } from '../reactive-action-store';

describe('createReactiveActionStore', () => {
    it('starts in the `idle` state', () => {
        const store = createReactiveActionStore(() => Promise.resolve('never'));
        expect(store.getState()).toStrictEqual({
            data: undefined,
            error: undefined,
            status: 'idle',
        });
    });

    it('transitions `idle` → `running` → `success` on a successful dispatch', async () => {
        expect.assertions(2);
        const { promise, resolve } = Promise.withResolvers<number>();
        const store = createReactiveActionStore(() => promise);
        const dispatched = store.dispatchAsync();
        expect(store.getState()).toStrictEqual({
            data: undefined,
            error: undefined,
            status: 'running',
        });
        resolve(42);
        await dispatched;
        expect(store.getState()).toStrictEqual({
            data: 42,
            error: undefined,
            status: 'success',
        });
    });

    it('transitions `idle` → `running` → `error` when the dispatch rejects', async () => {
        expect.assertions(2);
        const { promise, reject } = Promise.withResolvers<number>();
        const store = createReactiveActionStore(() => promise);
        const dispatched = store.dispatchAsync();
        expect(store.getState()).toStrictEqual({
            data: undefined,
            error: undefined,
            status: 'running',
        });
        const failure = new Error('boom');
        reject(failure);
        await dispatched.catch(() => {});
        expect(store.getState()).toStrictEqual({
            data: undefined,
            error: failure,
            status: 'error',
        });
    });

    it('returns `undefined` synchronously from `dispatch`', () => {
        const store = createReactiveActionStore(() => Promise.reject(new Error('boom')));
        expect(store.dispatch()).toBeUndefined();
    });

    it('rejects `dispatchAsync` on failure so callers can `try/catch`', async () => {
        expect.assertions(1);
        const store = createReactiveActionStore(() => Promise.reject(new Error('boom')));
        await expect(store.dispatchAsync()).rejects.toThrow('boom');
    });

    it('resolves `dispatchAsync` with the wrapped function result on success', async () => {
        expect.assertions(1);
        const store = createReactiveActionStore(() => Promise.resolve(42));
        await expect(store.dispatchAsync()).resolves.toBe(42);
    });

    it('forwards the `AbortSignal` as the first argument of the wrapped function', async () => {
        expect.assertions(1);
        const fn = jest.fn<Promise<string>, [AbortSignal, string, number]>(() => Promise.resolve('ok'));
        const store = createReactiveActionStore(fn);
        await store.dispatchAsync('hello', 7);
        expect(fn.mock.calls).toStrictEqual([[expect.any(AbortSignal), 'hello', 7]]);
    });

    it('aborts an in-flight dispatch when a new dispatch supersedes it', () => {
        const signals: AbortSignal[] = [];
        const store = createReactiveActionStore((signal: AbortSignal) => {
            signals.push(signal);
            return new Promise<string>(() => {});
        });
        store.dispatch();
        store.dispatch();
        expect(signals[0].aborted).toBe(true);
    });

    it('rejects a superseded `dispatchAsync` with an `AbortError`', async () => {
        expect.assertions(1);
        const store = createReactiveActionStore(() => new Promise<string>(() => {}));
        const first = store.dispatchAsync();
        store.dispatch();
        await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('rejects `dispatchAsync` with an `AbortError` if superseded after `fn` resolves but before the continuation runs', async () => {
        expect.assertions(1);
        const { promise, resolve } = Promise.withResolvers<string>();
        const store = createReactiveActionStore(() => promise);
        const first = store.dispatchAsync();
        resolve('stale');
        // Let the wrapper promise resolve, then synchronously supersede before
        // `dispatchAsync`'s await continuation runs.
        await Promise.resolve();
        store.dispatch();
        await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('rejects `dispatchAsync` with an `AbortError` if superseded after `fn` rejects but before the continuation runs', async () => {
        expect.assertions(1);
        const { promise, reject } = Promise.withResolvers<string>();
        const store = createReactiveActionStore(() => promise);
        const first = store.dispatchAsync();
        reject(new Error('nope'));
        // Let the wrapper promise reject, then synchronously supersede before
        // `dispatchAsync`'s catch continuation runs — caller should see AbortError,
        // not the masked real error.
        await Promise.resolve();
        store.dispatch();
        await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('reflects only the most recent dispatch when two dispatches run in quick succession', async () => {
        expect.assertions(1);
        const { promise: firstPromise, resolve: resolveFirst } = Promise.withResolvers<string>();
        const { promise: secondPromise, resolve: resolveSecond } = Promise.withResolvers<string>();
        const results = [firstPromise, secondPromise];
        const store = createReactiveActionStore(() => results.shift()!);
        store.dispatch();
        const second = store.dispatchAsync();
        resolveSecond('second');
        await second;
        expect(store.getState()).toStrictEqual({
            data: 'second',
            error: undefined,
            status: 'success',
        });
        resolveFirst('first');
    });

    it('does not overwrite the superseding call when a superseded call rejects later', async () => {
        expect.assertions(1);
        const { promise: firstPromise, reject: rejectFirst } = Promise.withResolvers<string>();
        const { promise: secondPromise, resolve: resolveSecond } = Promise.withResolvers<string>();
        const results = [firstPromise, secondPromise];
        const store = createReactiveActionStore(() => results.shift()!);
        store.dispatch();
        const second = store.dispatchAsync();
        resolveSecond('winner');
        await second;
        rejectFirst(new Error('late loser'));
        await Promise.resolve();
        await Promise.resolve();
        expect(store.getState()).toStrictEqual({
            data: 'winner',
            error: undefined,
            status: 'success',
        });
    });

    it('does not overwrite the idle state when a superseded call resolves after `reset`', async () => {
        expect.assertions(1);
        const { promise, resolve } = Promise.withResolvers<string>();
        const store = createReactiveActionStore(() => promise);
        store.dispatch();
        store.reset();
        resolve('stale');
        await Promise.resolve();
        await Promise.resolve();
        expect(store.getState()).toStrictEqual({
            data: undefined,
            error: undefined,
            status: 'idle',
        });
    });

    describe('reset()', () => {
        it('returns the store to idle from a success state', async () => {
            expect.assertions(1);
            const store = createReactiveActionStore(() => Promise.resolve('ok'));
            await store.dispatchAsync();
            store.reset();
            expect(store.getState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'idle',
            });
        });

        it('returns the store to idle from an error state', async () => {
            expect.assertions(1);
            const store = createReactiveActionStore(() => Promise.reject(new Error('boom')));
            await store.dispatchAsync().catch(() => {});
            store.reset();
            expect(store.getState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'idle',
            });
        });

        it('aborts an in-flight dispatch', () => {
            const signals: AbortSignal[] = [];
            const store = createReactiveActionStore((signal: AbortSignal) => {
                signals.push(signal);
                return new Promise<string>(() => {});
            });
            store.dispatch();
            store.reset();
            expect(signals[0].aborted).toBe(true);
        });

        it('rejects an in-flight `dispatchAsync` with an `AbortError`', async () => {
            expect.assertions(1);
            const store = createReactiveActionStore(() => new Promise<string>(() => {}));
            const dispatched = store.dispatchAsync();
            store.reset();
            await expect(dispatched).rejects.toMatchObject({ name: 'AbortError' });
        });
    });

    describe('subscribe()', () => {
        it('notifies listeners on transition to `running`', () => {
            const store = createReactiveActionStore(() => new Promise<string>(() => {}));
            const listener = jest.fn();
            store.subscribe(listener);
            store.dispatch();
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('notifies listeners on transition to `success`', async () => {
            expect.assertions(1);
            const { promise, resolve } = Promise.withResolvers<string>();
            const store = createReactiveActionStore(() => promise);
            const dispatched = store.dispatchAsync();
            const listener = jest.fn();
            store.subscribe(listener);
            resolve('ok');
            await dispatched;
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('notifies listeners on transition to `error`', async () => {
            expect.assertions(1);
            const { promise, reject } = Promise.withResolvers<string>();
            const store = createReactiveActionStore(() => promise);
            const dispatched = store.dispatchAsync();
            const listener = jest.fn();
            store.subscribe(listener);
            reject(new Error('boom'));
            await dispatched.catch(() => {});
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('does not notify listeners that unsubscribed before the transition', async () => {
            expect.assertions(1);
            const store = createReactiveActionStore(() => Promise.resolve('ok'));
            const listener = jest.fn();
            const unsubscribe = store.subscribe(listener);
            unsubscribe();
            await store.dispatchAsync();
            expect(listener).not.toHaveBeenCalled();
        });

        it('notifies multiple listeners independently', async () => {
            expect.assertions(2);
            const store = createReactiveActionStore(() => Promise.resolve('ok'));
            const listenerA = jest.fn();
            const listenerB = jest.fn();
            store.subscribe(listenerA);
            store.subscribe(listenerB);
            await store.dispatchAsync();
            expect(listenerA).toHaveBeenCalledTimes(2);
            expect(listenerB).toHaveBeenCalledTimes(2);
        });

        it('the unsubscribe function is idempotent', () => {
            const store = createReactiveActionStore(() => Promise.resolve('ok'));
            const unsubscribe = store.subscribe(jest.fn());
            expect(() => {
                unsubscribe();
                unsubscribe();
            }).not.toThrow();
        });

        it('notifies on reset() from a non-idle state', async () => {
            expect.assertions(1);
            const store = createReactiveActionStore(() => Promise.resolve('ok'));
            await store.dispatchAsync();
            const listener = jest.fn();
            store.subscribe(listener);
            store.reset();
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('does not notify on reset() when already idle', () => {
            const store = createReactiveActionStore(() => Promise.resolve('ok'));
            const listener = jest.fn();
            store.subscribe(listener);
            store.reset();
            expect(listener).not.toHaveBeenCalled();
        });

        it('does not notify on a superseding dispatch when the state is already `running`', () => {
            const store = createReactiveActionStore(() => new Promise<string>(() => {}));
            store.dispatch();
            const listener = jest.fn();
            store.subscribe(listener);
            store.dispatch();
            expect(listener).not.toHaveBeenCalled();
        });
    });

    it('has a stable `dispatch` reference across state changes', async () => {
        expect.assertions(1);
        const store = createReactiveActionStore(() => Promise.resolve('ok'));
        const initial = store.dispatch;
        await store.dispatchAsync();
        store.reset();
        expect(store.dispatch).toBe(initial);
    });

    it('returns a stable snapshot reference for the `idle` state across resets', async () => {
        expect.assertions(1);
        const store = createReactiveActionStore(() => Promise.resolve('ok'));
        const idleBefore = store.getState();
        await store.dispatchAsync();
        store.reset();
        expect(store.getState()).toBe(idleBefore);
    });

    describe('stale-while-revalidate', () => {
        it('preserves the last successful `data` across a subsequent `running` state', async () => {
            expect.assertions(1);
            const { promise: second, resolve: resolveSecond } = Promise.withResolvers<string>();
            const results = [Promise.resolve('first'), second];
            const store = createReactiveActionStore(() => results.shift()!);
            await store.dispatchAsync();
            store.dispatch();
            expect(store.getState()).toStrictEqual({
                data: 'first',
                error: undefined,
                status: 'running',
            });
            resolveSecond('second');
        });

        it('preserves the last successful `data` across a subsequent `error` state', async () => {
            expect.assertions(1);
            const failure = new Error('boom');
            const results = [Promise.resolve('first'), Promise.reject(failure)];
            const store = createReactiveActionStore(() => results.shift()!);
            await store.dispatchAsync();
            await store.dispatchAsync().catch(() => {});
            expect(store.getState()).toStrictEqual({
                data: 'first',
                error: failure,
                status: 'error',
            });
        });

        it('replaces stale `data` when a subsequent dispatch succeeds with a new value', async () => {
            expect.assertions(1);
            const results = [Promise.resolve('first'), Promise.resolve('second')];
            const store = createReactiveActionStore(() => results.shift()!);
            await store.dispatchAsync();
            await store.dispatchAsync();
            expect(store.getState()).toStrictEqual({
                data: 'second',
                error: undefined,
                status: 'success',
            });
        });

        it('clears a previous error once a subsequent dispatch succeeds', async () => {
            expect.assertions(1);
            const results = [Promise.reject(new Error('boom')), Promise.resolve('ok')];
            const store = createReactiveActionStore(() => results.shift()!);
            await store.dispatchAsync().catch(() => {});
            await store.dispatchAsync();
            expect(store.getState()).toStrictEqual({
                data: 'ok',
                error: undefined,
                status: 'success',
            });
        });

        it('clears `data` on reset()', async () => {
            expect.assertions(1);
            const store = createReactiveActionStore(() => Promise.resolve('ok'));
            await store.dispatchAsync();
            store.reset();
            expect(store.getState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'idle',
            });
        });

        it('does not restore stale `data` after reset() when a new dispatch runs', () => {
            const { promise } = Promise.withResolvers<string>();
            const results = [Promise.resolve('first'), promise];
            const store = createReactiveActionStore(() => results.shift()!);
            store.dispatch();
            store.reset();
            store.dispatch();
            expect(store.getState()).toStrictEqual({
                data: undefined,
                error: undefined,
                status: 'running',
            });
        });

        it('keeps `data` undefined in the error state when no prior success occurred', async () => {
            expect.assertions(1);
            const failure = new Error('boom');
            const store = createReactiveActionStore(() => Promise.reject(failure));
            await store.dispatchAsync().catch(() => {});
            expect(store.getState()).toStrictEqual({
                data: undefined,
                error: failure,
                status: 'error',
            });
        });
    });
});
