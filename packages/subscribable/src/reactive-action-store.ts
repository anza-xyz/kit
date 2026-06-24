import { AbortController } from '@solana/event-target-impl';
import { getAbortablePromise } from '@solana/promises';

/** Lifecycle status of a {@link ReactiveActionStore}. */
export type ReactiveActionStatus = 'error' | 'idle' | 'running' | 'success';

/**
 * Discriminated state of a {@link ReactiveActionStore}, keyed by {@link ReactiveActionStatus}.
 *
 * `data` holds the most recent successful result and `error` holds the most recent failure. Both
 * persist through subsequent `running` states so call sites can keep rendering stale content
 * while a retry is in flight. `success` clears `error`; only `reset()` clears `data`.
 */
export type ReactiveActionState<TResult> =
    | { readonly data: TResult | undefined; readonly error: unknown; readonly status: 'error' }
    | { readonly data: TResult | undefined; readonly error: unknown; readonly status: 'running' }
    | { readonly data: TResult; readonly error: undefined; readonly status: 'success' }
    | { readonly data: undefined; readonly error: undefined; readonly status: 'idle' };

/**
 * A framework-agnostic state machine that wraps an async function and exposes a
 * `{ dispatch, getState, subscribe, reset }` contract. Bridges trivially into
 * `useSyncExternalStore`, Svelte stores, Vue's `shallowRef`, and similar reactive primitives.
 *
 * @see {@link createReactiveActionStore}
 */
export type ReactiveActionStore<TArgs extends readonly unknown[], TResult> = {
    /**
     * Fire-and-forget dispatch. Returns `undefined` synchronously and never throws — failures
     * surface on state as `{ status: 'error' }`, and superseded or `reset()`-aborted calls produce
     * no state update. Use from UI event handlers; there's no promise to handle or `.catch`.
     *
     * @see {@link ReactiveActionStore.dispatchAsync} when you need the resolved value or propagated errors.
     * @see {@link ReactiveActionStore.withSignal} to attach a caller-provided `AbortSignal` to a dispatch.
     */
    readonly dispatch: (...args: TArgs) => void;
    /**
     * Promise-returning dispatch for imperative callers. Resolves with the wrapped function's
     * result on success. Rejects with the thrown error on failure, and with an `AbortError` when
     * the call is superseded or `reset()` is invoked — filter those with `isAbortError` from
     * `@solana/promises`.
     */
    readonly dispatchAsync: (...args: TArgs) => Promise<TResult>;
    /**
     * Returns the current lifecycle snapshot: `{ data, error, status }`. The returned object has
     * stable identity between state changes, making it safe to pass directly as the
     * `getSnapshot` argument to React's `useSyncExternalStore`.
     *
     * @see {@link ReactiveActionState}
     */
    readonly getState: () => ReactiveActionState<TResult>;
    /** Aborts any in-flight dispatch and resets the state to `{ status: 'idle' }`. */
    readonly reset: () => void;
    /** Registers a listener called on every state change. Returns an unsubscribe function. */
    readonly subscribe: (listener: () => void) => () => void;
    /**
     * Returns a thin wrapper exposing `dispatch` / `dispatchAsync` that compose `signal` with the
     * store's internal per-dispatch controller via `AbortSignal.any` — aborting either cancels
     * the in-flight call. Aborting the caller-provided signal surfaces the abort reason on state
     * as `{ status: 'error' }`; the internal controller path (supersession by a newer dispatch or
     * `reset()`) is silent by design so the newer dispatch owns state. Use this to attach a
     * caller-provided cancellation source (per-attempt timeout, shared kill switch, parent-context
     * signal) without touching the bare `dispatch` / `dispatchAsync` API.
     *
     * - Per-attempt timeout: `store.withSignal(AbortSignal.timeout(5_000)).dispatch(args)` — fresh
     *   clock per call.
     * - Permanent kill switch: hold one `AbortController`, bind the wrapper once
     *   (`const killable = store.withSignal(killCtrl.signal)`), and use `killable.dispatch(...)`
     *   everywhere; aborting the controller cancels in-flight and short-circuits future calls.
     *
     * The wrapper exposes only `dispatch` / `dispatchAsync` — `getState` / `subscribe` / `reset`
     * remain store-level concerns on the parent.
     */
    readonly withSignal: (signal: AbortSignal) => {
        readonly dispatch: (...args: TArgs) => void;
        readonly dispatchAsync: (...args: TArgs) => Promise<TResult>;
    };
};

/**
 * Duck-type for objects that build a {@link ReactiveActionStore} on demand via `reactiveStore()`.
 * Satisfied by `PendingRpcRequest<T>`. The `[]` argument tuple is intentional — the operation's
 * arguments are already baked into the pending request, so each `dispatch()` re-fires the same
 * call.
 *
 * The returned store is in the `idle` state — the caller is responsible for calling `dispatch()`
 * to fire the first attempt. Attach a caller-provided cancellation source per dispatch via
 * `store.withSignal(signal).dispatch(...)` — see {@link ReactiveActionStore.withSignal}.
 *
 * @typeParam T - The value type resolved by the wrapped operation.
 *
 * @example
 * ```ts
 * function bind<T>(source: ReactiveActionSource<T>) {
 *     const store = source.reactiveStore();
 *     // Per-attempt timeout, fresh signal per call:
 *     store.withSignal(AbortSignal.timeout(30_000)).dispatch();
 *     return store;
 * }
 * ```
 *
 * @see {@link ReactiveActionStore}
 * @see {@link ReactiveStreamSource}
 */
export type ReactiveActionSource<T> = {
    reactiveStore(): ReactiveActionStore<[], T>;
};

const IDLE_STATE: ReactiveActionState<never> = Object.freeze({
    data: undefined,
    error: undefined,
    status: 'idle',
});

/**
 * Wraps an async function in a {@link ReactiveActionStore}. Each `dispatch` creates a fresh
 * {@link AbortController} and aborts the previous one; the superseded call's outcome is dropped,
 * so only the most recent dispatch can mutate state.
 *
 * The wrapped function receives the `AbortSignal` as its first argument, followed by whatever
 * arguments were passed to `dispatch`. Callers attach their own cancellation source per-call via
 * {@link ReactiveActionStore.withSignal} — `store.withSignal(signal).dispatch(...)`. The caller's
 * signal is composed with the per-dispatch controller via `AbortSignal.any`, so aborting it
 * cancels the in-flight call and surfaces the abort reason on state.
 *
 * @typeParam TArgs - Argument tuple forwarded from `dispatch` to `fn`.
 * @typeParam TResult - Resolved value type of `fn`.
 * @param fn - Async function to wrap. Receives an {@link AbortSignal} plus the dispatch arguments.
 * @return A {@link ReactiveActionStore} exposing `dispatch`, `dispatchAsync`, `getState`, `subscribe`,
 * `reset`, and `withSignal`.
 *
 * @example
 * ```ts
 * const store = createReactiveActionStore(async (signal, accountId: Address) => {
 *     const response = await fetch(`/api/accounts/${accountId}`, { signal });
 *     return response.json();
 * });
 *
 * store.subscribe(() => console.log(store.getState()));
 * store.dispatch(someAccountId); // fire-and-forget; state is the source of truth
 *
 * // Per-attempt timeout — fresh signal per call:
 * store.withSignal(AbortSignal.timeout(30_000)).dispatch(someAccountId);
 *
 * // Imperative call with the resolved value:
 * const account = await store.dispatchAsync(someAccountId);
 * ```
 *
 * @see {@link ReactiveActionStore}
 */
export function createReactiveActionStore<TArgs extends readonly unknown[], TResult>(
    fn: (signal: AbortSignal, ...args: TArgs) => Promise<TResult>,
): ReactiveActionStore<TArgs, TResult> {
    let state: ReactiveActionState<TResult> = IDLE_STATE;
    let currentController: AbortController | undefined;
    const listeners = new Set<() => void>();

    function setState(next: ReactiveActionState<TResult>) {
        if (state.status === next.status && state.data === next.data && state.error === next.error) {
            return;
        }
        state = next;
        listeners.forEach(listener => listener());
    }

    const dispatchAsyncWithSignal = async (userSignal: AbortSignal | undefined, ...args: TArgs): Promise<TResult> => {
        currentController?.abort();
        // If the caller's signal is already aborted, surface as error and bail.
        if (userSignal?.aborted) {
            setState({ data: state.data, error: userSignal.reason, status: 'error' });
            throw userSignal.reason;
        }
        const controller = new AbortController();
        currentController = controller;
        const signal = userSignal ? AbortSignal.any([controller.signal, userSignal]) : controller.signal;
        const previousData = state.data;
        const previousError = state.error;
        setState({ data: previousData, error: previousError, status: 'running' });
        try {
            const result = await getAbortablePromise(fn(signal, ...args), signal);
            if (signal.aborted) {
                throw signal.reason;
            }
            setState({ data: result, error: undefined, status: 'success' });
            return result;
        } catch (error) {
            // Superseded by a newer dispatch or `reset()` — drop silently so only the most recent
            // dispatch mutates state, and reject with the abort reason rather than any underlying
            // failure that happened to race the abort.
            if (controller.signal.aborted) {
                throw controller.signal.reason;
            }
            // Real failure or the caller-provided signal firing — surface as error state.
            setState({ data: previousData, error, status: 'error' });
            throw error;
        }
    };

    const dispatchAsync = (...args: TArgs): Promise<TResult> => dispatchAsyncWithSignal(undefined, ...args);
    const dispatch = (...args: TArgs): void => {
        dispatchAsync(...args).catch(() => {});
    };

    return {
        dispatch,
        dispatchAsync,
        getState: () => state,
        reset: () => {
            currentController?.abort();
            currentController = undefined;
            setState(IDLE_STATE);
        },
        subscribe: listener => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        withSignal: (signal: AbortSignal) => ({
            dispatch: (...args: TArgs): void => {
                dispatchAsyncWithSignal(signal, ...args).catch(() => {});
            },
            dispatchAsync: (...args: TArgs): Promise<TResult> => dispatchAsyncWithSignal(signal, ...args),
        }),
    };
}
