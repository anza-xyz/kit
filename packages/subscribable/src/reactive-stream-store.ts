import { SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED, SolanaError } from '@solana/errors';
import { AbortController } from '@solana/event-target-impl';

import { DataPublisher } from './data-publisher';

type Config = Readonly<{
    /**
     * Triggering this abort signal will cause the store to stop updating and will disconnect it from
     * the underlying data publisher.
     */
    abortSignal: AbortSignal;
    /**
     * Messages from this channel of `dataPublisher` will be used to update the store's state.
     */
    dataChannelName: string;
    // FIXME: It would be nice to be able to constrain the type of `dataPublisher` to one that
    //        definitely supports the `dataChannelName` and `errorChannelName` channels, and
    //        furthermore publishes `TData` on the `dataChannelName` channel. This is more difficult
    //        than it should be: https://tsplay.dev/NlZelW
    dataPublisher: DataPublisher;
    /**
     * Messages from this channel of `dataPublisher` will cause subscribers to be notified without
     * updating the state, so that they can respond to the error condition.
     */
    errorChannelName: string;
}>;

type FactoryConfig = Readonly<{
    /**
     * Triggering this abort signal will cause the store to stop updating and will disconnect it from
     * any active {@link DataPublisher}. Subsequent calls to {@link ReactiveStreamStore.retry | `retry()`}
     * are no-ops once this signal has fired.
     */
    abortSignal: AbortSignal;
    /**
     * An async factory that produces a fresh {@link DataPublisher} each time it is invoked. Called
     * once on construction and again on every {@link ReactiveStreamStore.retry | `retry()`}. Rejections
     * surface as a store error.
     */
    createDataPublisher: () => Promise<DataPublisher>;
    /**
     * Messages from this channel of the produced `DataPublisher` will be used to update the store's
     * state.
     */
    dataChannelName: string;
    /**
     * Messages from this channel of the produced `DataPublisher` will transition the store to an
     * error state, preserving the last known value.
     */
    errorChannelName: string;
}>;

/**
 * The lifecycle state of a {@link ReactiveStreamStore} as a single snapshot.
 *
 * - `loading`: the store is waiting for its first value. `data` is `undefined`.
 * - `loaded`: a value has been received and no error is active. `data` is defined.
 * - `error`: the stream failed. `data` is the last known value (or `undefined` if no value ever
 *   arrived), and `error` holds the failure.
 * - `retrying`: a {@link ReactiveStreamStore.retry | `retry()`} is in progress after a previous error.
 *   `error` is cleared; `data` is preserved from before the failure if present.
 */
export type ReactiveState<T> =
    | { readonly data: T | undefined; readonly error: undefined; readonly status: 'retrying' }
    | { readonly data: T | undefined; readonly error: unknown; readonly status: 'error' }
    | { readonly data: T; readonly error: undefined; readonly status: 'loaded' }
    | { readonly data: undefined; readonly error: undefined; readonly status: 'loading' };

const LOADING_STATE: ReactiveState<never> = Object.freeze({
    data: undefined,
    error: undefined,
    status: 'loading',
});

/**
 * A reactive store that holds the latest value published to a data channel and allows external
 * systems to subscribe to changes. Compatible with `useSyncExternalStore`, Svelte stores, Solid's
 * `from()`, and other reactive primitives that expect a `{ subscribe, getUnifiedState }` contract.
 *
 * @example
 * ```ts
 * // React — the unified state snapshot has stable identity per update, making it suitable as
 * // the second argument to `useSyncExternalStore`.
 * const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
 * if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.retry} />;
 * if (state.status === 'loading') return <Spinner />;
 * return <View data={state.data} />;
 * ```
 *
 * @see {@link createReactiveStoreFromDataPublisherFactory}
 */
export type ReactiveStreamStore<T> = {
    /**
     * Returns the error published to the error channel, or `undefined` if no error has occurred.
     *
     * @deprecated Use {@link ReactiveStreamStore.getUnifiedState | `getUnifiedState()`} instead. This
     * getter returns only the error field and cannot narrow the relationship between the current
     * value, error, and status.
     */
    getError(): unknown;
    /**
     * Returns the most recent value published to the data channel, or `undefined` if no
     * notification has arrived yet. On error, continues to return the last known value.
     *
     * @deprecated Use {@link ReactiveStreamStore.getUnifiedState | `getUnifiedState()`} instead. This
     * getter returns only the value field and does not surface lifecycle status (e.g. `retrying`).
     */
    getState(): T | undefined;
    /**
     * Returns the current lifecycle snapshot: `{ data, error, status }`. The returned object has
     * stable identity between state changes, making it safe to pass directly as the
     * `getSnapshot` argument to React's `useSyncExternalStore`.
     *
     * @see {@link ReactiveState}
     */
    getUnifiedState(): ReactiveState<T>;
    /**
     * Re-opens the stream after an error. No-op when the store is not in the `error` state.
     */
    retry(): void;
    /**
     * Registers a callback to be called whenever the state changes or an error is received.
     * Returns an unsubscribe function. Safe to call multiple times.
     */
    subscribe(callback: () => void): () => void;
};

/**
 * @deprecated Use {@link ReactiveStreamStore} instead. This alias will be removed in a future
 * major release.
 */
export type ReactiveStore<T> = ReactiveStreamStore<T>;

/**
 * Returns a {@link ReactiveStreamStore} given a data publisher.
 *
 * The store will update its state with each message published to `dataChannelName` and notify all
 * subscribers. When a message is published to `errorChannelName`, subscribers are notified so they
 * can react to the error condition, but the last-known state is preserved. Triggering the abort
 * signal disconnects the store from the data publisher.
 *
 * Things to note:
 *
 * - `getUnifiedState()` starts in `status: 'loading'` until the first notification arrives.
 * - On error, `getUnifiedState().data` continues to return the last known value and `error` holds
 *   the failure. Only the first error is captured.
 * - The function returned by `subscribe` is idempotent — calling it multiple times is safe.
 * - Because a `DataPublisher` instance cannot be restarted, {@link ReactiveStreamStore.retry | `retry()`}
 *   on the returned store throws a
 *   {@link SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED | `SolanaError`}.
 *
 * @param config
 *
 * @deprecated Use {@link createReactiveStoreFromDataPublisherFactory} instead. That variant accepts
 * a factory function for the underlying {@link DataPublisher} and can therefore support
 * {@link ReactiveStreamStore.retry | `retry()`}.
 */
export function createReactiveStoreFromDataPublisher<TData>({
    abortSignal,
    dataChannelName,
    dataPublisher,
    errorChannelName,
}: Config): ReactiveStreamStore<TData> {
    let currentState: ReactiveState<TData> = LOADING_STATE;
    const subscribers = new Set<() => void>();

    const abortController = new AbortController();
    abortSignal.addEventListener('abort', () => abortController.abort(abortSignal.reason));

    function notify() {
        subscribers.forEach(cb => cb());
    }

    dataPublisher.on(
        dataChannelName,
        data => {
            currentState = { data: data as TData, error: undefined, status: 'loaded' };
            notify();
        },
        { signal: abortController.signal },
    );
    dataPublisher.on(
        errorChannelName,
        err => {
            if (currentState.status === 'error') return;
            currentState = { data: currentState.data, error: err, status: 'error' };
            abortController.abort(err);
            notify();
        },
        { signal: abortController.signal },
    );

    return {
        getError(): unknown {
            return currentState.error;
        },
        getState(): TData | undefined {
            return currentState.data;
        },
        getUnifiedState(): ReactiveState<TData> {
            return currentState;
        },
        retry(): void {
            throw new SolanaError(SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED);
        },
        subscribe(callback: () => void): () => void {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
    };
}

/**
 * Returns a {@link ReactiveStreamStore} that wires itself to a fresh {@link DataPublisher} on
 * construction and on every {@link ReactiveStreamStore.retry | `retry()`}.
 *
 * Unlike {@link createReactiveStoreFromDataPublisher}, this variant accepts a `createDataPublisher`
 * factory rather than a ready-made publisher. That lets the store tear down a broken stream and
 * open a new one without losing subscribers or the last known value.
 *
 * Things to note:
 *
 * - `getUnifiedState()` starts in `status: 'loading'` until the first notification arrives.
 * - On error, the store transitions to `status: 'error'` preserving the last known value. Only the
 *   first error per connection window is captured — a subsequent `retry()` resets that window.
 * - `retry()` is a no-op unless the store is currently in `status: 'error'`. When it fires, the
 *   store transitions to `status: 'retrying'` (preserving stale data), invokes
 *   `createDataPublisher()`, and wires up a fresh connection. If the factory rejects, the store
 *   transitions to `status: 'error'` with the rejection reason.
 * - Triggering the caller's `abortSignal` disconnects the store permanently; subsequent `retry()`
 *   calls are no-ops.
 *
 * @param config
 *
 * @example
 * ```ts
 * const store = createReactiveStoreFromDataPublisherFactory({
 *     abortSignal,
 *     async createDataPublisher() {
 *         return getDataPublisherFromEventEmitter(new WebSocket(url));
 *     },
 *     dataChannelName: 'message',
 *     errorChannelName: 'error',
 * });
 * const unsubscribe = store.subscribe(() => {
 *     const snapshot = store.getUnifiedState();
 *     if (snapshot.status === 'error') console.error('Connection failed:', snapshot.error);
 *     else if (snapshot.status === 'loaded') console.log('Latest:', snapshot.data);
 * });
 * // Call `store.retry()` to recover after an error — e.g. from a user-triggered "Retry" button.
 * ```
 */
export function createReactiveStoreFromDataPublisherFactory<TData>({
    abortSignal,
    createDataPublisher,
    dataChannelName,
    errorChannelName,
}: FactoryConfig): ReactiveStreamStore<TData> {
    let currentState: ReactiveState<TData> = LOADING_STATE;
    const subscribers = new Set<() => void>();

    const outerController = new AbortController();
    abortSignal.addEventListener('abort', () => outerController.abort(abortSignal.reason));

    function notify() {
        subscribers.forEach(cb => cb());
    }

    function connect() {
        if (outerController.signal.aborted) return;
        // Inner signal is passed to data publisher
        const innerController = new AbortController();
        // Forward an abort from the outer signal to the inner one, so that when the caller aborts, we disconnect
        // Scope this forwarder to the inner signal so it's removed on reconnection
        // and we don't accumulate listeners on the outer signal across retries.
        const forwardAbort = () => innerController.abort(outerController.signal.reason);
        outerController.signal.addEventListener('abort', forwardAbort, { signal: innerController.signal });
        createDataPublisher().then(
            publisher => {
                if (innerController.signal.aborted) return;
                publisher.on(
                    dataChannelName,
                    data => {
                        currentState = { data: data as TData, error: undefined, status: 'loaded' };
                        notify();
                    },
                    { signal: innerController.signal },
                );
                publisher.on(
                    errorChannelName,
                    err => {
                        if (currentState.status === 'error') return;
                        currentState = { data: currentState.data, error: err, status: 'error' };
                        innerController.abort(err);
                        notify();
                    },
                    { signal: innerController.signal },
                );
            },
            err => {
                if (innerController.signal.aborted) return;
                currentState = { data: currentState.data, error: err, status: 'error' };
                innerController.abort(err);
                notify();
            },
        );
    }

    connect();

    return {
        getError(): unknown {
            return currentState.error;
        },
        getState(): TData | undefined {
            return currentState.data;
        },
        getUnifiedState(): ReactiveState<TData> {
            return currentState;
        },
        retry(): void {
            if (outerController.signal.aborted) return;
            if (currentState.status !== 'error') return;
            currentState = { data: currentState.data, error: undefined, status: 'retrying' };
            notify();
            connect();
        },
        subscribe(callback: () => void): () => void {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
    };
}
