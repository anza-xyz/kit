import { AbortController } from '@solana/event-target-impl';

import { DataPublisher } from './data-publisher';

type FactoryConfig = Readonly<{
    // FIXME: It would be nice to be able to constrain the type returned by `createDataPublisher` to one that
    //        definitely supports the `dataChannelName` and `errorChannelName` channels, and
    //        furthermore publishes `TData` on the `dataChannelName` channel. This is more difficult
    //        than it should be: https://tsplay.dev/NlZelW
    /**
     * An async factory that produces a fresh {@link DataPublisher} each time it is invoked. Called
     * on every {@link ReactiveStreamStore.connect | `connect()`}.
     *
     * Receives an {@link AbortSignal} that fires when this specific connection window should tear
     * down — composed from the per-connection inner controller and (if attached via
     * {@link ReactiveStreamStore.withSignal | `withSignal()`}) the caller-provided signal via
     * `AbortSignal.any`. Thread it into the underlying transport's own cancellation so the
     * connection itself stops on per-connection abort, not just the stream-store's listeners.
     * Rejections surface as a store error.
     */
    createDataPublisher: (signal: AbortSignal) => Promise<DataPublisher>;
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
 * - `idle`: the store has not yet been connected, or has been reset via
 *   {@link ReactiveStreamStore.reset | `reset()`}. Call
 *   {@link ReactiveStreamStore.connect | `connect()`} to open the underlying stream.
 * - `loading`: a first connection is in progress; no data has arrived yet.
 * - `loaded`: a value has been received and no error is active.
 * - `error`: the stream failed. `data` holds the last known value (or `undefined` if none ever
 *   arrived) and `error` holds the failure.
 * - `retrying`: a follow-up `connect()` is in progress after a previous outcome. `error` is
 *   cleared; `data` is preserved from the previous connection if any.
 */
export type ReactiveState<T> =
    | { readonly data: T | undefined; readonly error: undefined; readonly status: 'retrying' }
    | { readonly data: T | undefined; readonly error: unknown; readonly status: 'error' }
    | { readonly data: T; readonly error: undefined; readonly status: 'loaded' }
    | { readonly data: undefined; readonly error: undefined; readonly status: 'idle' }
    | { readonly data: undefined; readonly error: undefined; readonly status: 'loading' };

const IDLE_STATE: ReactiveState<never> = Object.freeze({
    data: undefined,
    error: undefined,
    status: 'idle',
});

/**
 * A reactive store that holds the latest value published to a data channel and allows external
 * systems to subscribe to changes. Compatible with `useSyncExternalStore`, Svelte stores, Solid's
 * `from()`, and other reactive primitives that expect a `{ subscribe, getUnifiedState }` contract.
 *
 * The store starts in `status: 'idle'`. Call {@link ReactiveStreamStore.connect | `connect()`}
 * to open the underlying stream; the store will then transition through `loading` → `loaded` (or
 * `error`). A subsequent `connect()` after `loaded` or `error` transitions through `retrying`
 * while preserving the last known value.
 *
 * @example
 * ```ts
 * // React — the unified state snapshot has stable identity per update, making it suitable as
 * // the second argument to `useSyncExternalStore`.
 * const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
 * useEffect(() => {
 *     store.connect();
 *     return () => store.reset();
 * }, [store]);
 * if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.connect} />;
 * if (state.status === 'loading' || state.status === 'idle') return <Spinner />;
 * return <View data={state.data} />;
 * ```
 *
 * @see {@link createReactiveStoreFromDataPublisherFactory}
 */
export type ReactiveStreamStore<T> = {
    /**
     * Open the underlying stream. Aborts any currently active connection, invokes the configured
     * factory, and transitions the store through `loading` (when called from `idle` or while a
     * connection is already in flight) or `retrying` (when called after a previous outcome —
     * i.e. `loaded` or `error`) before settling into `loaded` (on data) or `error` (on failure).
     */
    connect(): void;
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
     * Aborts any currently active connection and resets the store to `{ status: 'idle' }`. Both
     * `data` and `error` are cleared. Use this to tear down the connection without permanently
     * killing the store — a follow-up {@link ReactiveStreamStore.connect | `connect()`} will open
     * a fresh stream.
     */
    reset(): void;
    /**
     * Re-opens the stream after an error. No-op when the store is not in `status: 'error'`.
     *
     * @deprecated Use {@link ReactiveStreamStore.connect | `connect()`} instead. `connect()`
     * always (re)connects, regardless of current status — wrap with a status guard at the call
     * site if you need the error-only behaviour.
     */
    retry(): void;
    /**
     * Registers a callback to be called whenever the state changes or an error is received.
     * Returns an unsubscribe function. Safe to call multiple times.
     */
    subscribe(callback: () => void): () => void;
    /**
     * Returns a thin wrapper exposing `connect()` that composes `signal` with the store's internal
     * per-connection controller via `AbortSignal.any` — aborting either tears down the active
     * connection. Aborting the caller-provided signal surfaces the abort reason on state as
     * `{ status: 'error' }`; the internal controller path (supersession by a newer `connect()` or
     * `reset()`) is silent by design so the newer call owns state. Use this to attach a
     * caller-provided cancellation source (per-connection timeout, shared kill switch,
     * parent-context signal) without touching the bare `connect()` API.
     *
     * - Per-connection timeout: `store.withSignal(AbortSignal.timeout(30_000)).connect()` — fresh
     *   clock per call.
     * - Permanent kill switch: hold one `AbortController`, bind the wrapper once
     *   (`const killable = store.withSignal(killCtrl.signal)`), and use `killable.connect()`
     *   everywhere; aborting the controller cancels the active connection and short-circuits
     *   future calls through the bound wrapper.
     *
     * The wrapper exposes only `connect()` — `getUnifiedState` / `subscribe` / `reset` remain
     * store-level concerns on the parent.
     */
    withSignal(signal: AbortSignal): { readonly connect: () => void };
};

/**
 * @deprecated Use {@link ReactiveStreamStore} instead. This alias will be removed in a future
 * major release.
 */
export type ReactiveStore<T> = ReactiveStreamStore<T>;

/**
 * Duck-type for objects that build a {@link ReactiveStreamStore} on demand via a `reactiveStore()`
 * method. Satisfied by `PendingRpcSubscriptionsRequest<T>`. Reactive-framework bindings (e.g.
 * React's `useSubscription`) consume this duck-type so they don't have to name a concrete producer
 * type.
 *
 * The returned store is in `status: 'idle'` — the caller is responsible for invoking
 * {@link ReactiveStreamStore.connect | `connect()`} to open the underlying stream. Attach a
 * caller-provided cancellation source via {@link ReactiveStreamStore.withSignal | `withSignal()`}
 * — `store.withSignal(signal).connect()`.
 *
 * @typeParam T - The value type emitted by the resulting stream store.
 *
 * @example
 * ```ts
 * function bindWithTimeout<T>(source: ReactiveStreamSource<T>) {
 *     const store = source.reactiveStore();
 *     store.withSignal(AbortSignal.timeout(30_000)).connect();
 *     return store;
 * }
 * ```
 *
 * @see {@link ReactiveStreamStore}
 * @see {@link ReactiveActionSource}
 */
export type ReactiveStreamSource<T> = {
    reactiveStore(): ReactiveStreamStore<T>;
};

/**
 * Returns a {@link ReactiveStreamStore} that wires itself to a fresh {@link DataPublisher} on
 * every {@link ReactiveStreamStore.connect | `connect()`}.
 *
 * The store accepts a `createDataPublisher` factory rather than a ready-made publisher — that
 * lets the store tear down a broken stream and open a new one without losing subscribers or the
 * last known value. The factory receives the per-connection signal so the underlying transport
 * can stop on per-connection abort, not just the stream-store's listeners.
 *
 * Things to note:
 *
 * - The returned store starts in `status: 'idle'`. Call `connect()` to open the first stream.
 * - `createDataPublisher` is invoked on every `connect()`. From `idle`, the store transitions
 *   through `loading`; from any other status, through `retrying` while preserving the last
 *   known value.
 * - If `createDataPublisher` rejects, the store transitions to `status: 'error'` with the
 *   rejection as the error. Call `connect()` to try again.
 * - `reset()` aborts the current connection and returns the store to `idle`, clearing `data`
 *   and `error`. A follow-up `connect()` opens a fresh stream.
 * - Attach a caller-provided cancellation source via
 *   {@link ReactiveStreamStore.withSignal | `withSignal()`} — `store.withSignal(signal).connect()`
 *   composes the signal with the per-connection controller. Aborting the caller's signal
 *   transitions the store to `error` with that abort reason.
 *
 * @param config
 *
 * @example
 * ```ts
 * const store = createReactiveStoreFromDataPublisherFactory({
 *     createDataPublisher: signal => getDataPublisherFromEventEmitter(new WebSocket(url, { signal })),
 *     dataChannelName: 'message',
 *     errorChannelName: 'error',
 * });
 * const unsubscribe = store.subscribe(() => {
 *     const snapshot = store.getUnifiedState();
 *     if (snapshot.status === 'error') console.error('Connection failed:', snapshot.error);
 *     else if (snapshot.status === 'loaded') console.log('Latest:', snapshot.data);
 * });
 * // Fresh 30-second clock per connection attempt:
 * store.withSignal(AbortSignal.timeout(30_000)).connect();
 * ```
 */
export function createReactiveStoreFromDataPublisherFactory<TData>({
    createDataPublisher,
    dataChannelName,
    errorChannelName,
}: FactoryConfig): ReactiveStreamStore<TData> {
    let currentState: ReactiveState<TData> = IDLE_STATE;
    let currentInnerController: AbortController | undefined;
    const subscribers = new Set<() => void>();

    function notify() {
        subscribers.forEach(cb => cb());
    }

    function setState(next: ReactiveState<TData>) {
        if (
            currentState.status === next.status &&
            currentState.data === next.data &&
            currentState.error === next.error
        ) {
            return;
        }
        currentState = next;
        notify();
    }

    function performConnect(callerSignal: AbortSignal | undefined) {
        // Abort any currently active connection before starting a fresh one.
        currentInnerController?.abort();
        // If the caller's signal is already aborted, surface as error and bail.
        if (callerSignal?.aborted) {
            setState({ data: currentState.data, error: callerSignal.reason, status: 'error' });
            return;
        }
        // Transition based on whether we have a prior outcome to preserve. If already `loading`,
        // a connection is in flight — we've just aborted it and will rewire to a fresh factory
        // invocation below, but there's no user-visible value yet, so stay in `loading` rather
        // than detour through `retrying`.
        if (currentState.status === 'idle') {
            setState({ data: undefined, error: undefined, status: 'loading' });
        } else if (currentState.status !== 'loading') {
            setState({ data: currentState.data, error: undefined, status: 'retrying' });
        }
        // Inner signal is passed to the data publisher (composed with caller signal if any).
        const innerController = new AbortController();
        currentInnerController = innerController;
        const signal = callerSignal ? AbortSignal.any([innerController.signal, callerSignal]) : innerController.signal;
        // Caller's signal aborting (not just supersede via the inner controller) transitions the
        // store to error with the caller's abort reason. Scoped to the inner signal so the
        // listener is removed automatically on reconnect / reset.
        if (callerSignal) {
            callerSignal.addEventListener(
                'abort',
                () => {
                    if (innerController.signal.aborted) return;
                    setState({ data: currentState.data, error: callerSignal.reason, status: 'error' });
                    innerController.abort(callerSignal.reason);
                },
                { signal: innerController.signal },
            );
        }
        createDataPublisher(signal).then(
            publisher => {
                if (signal.aborted) return;
                publisher.on(
                    dataChannelName,
                    data => {
                        setState({ data: data as TData, error: undefined, status: 'loaded' });
                    },
                    { signal },
                );
                publisher.on(
                    errorChannelName,
                    err => {
                        if (currentState.status === 'error') return;
                        setState({ data: currentState.data, error: err, status: 'error' });
                        innerController.abort(err);
                    },
                    { signal },
                );
            },
            err => {
                if (signal.aborted) return;
                setState({ data: currentState.data, error: err, status: 'error' });
                innerController.abort(err);
            },
        );
    }

    function performReset() {
        currentInnerController?.abort();
        currentInnerController = undefined;
        setState(IDLE_STATE);
    }

    return {
        connect(): void {
            performConnect(undefined);
        },
        getError(): unknown {
            return currentState.error;
        },
        getState(): TData | undefined {
            return currentState.data;
        },
        getUnifiedState(): ReactiveState<TData> {
            return currentState;
        },
        reset: performReset,
        retry(): void {
            if (currentState.status !== 'error') return;
            performConnect(undefined);
        },
        subscribe(callback: () => void): () => void {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
        withSignal(signal: AbortSignal) {
            return {
                connect(): void {
                    performConnect(signal);
                },
            };
        },
    };
}
