import { AbortController } from '@solana/event-target-impl';
import { getAbortablePromise } from '@solana/promises';

/** Lifecycle status of a {@link ReactiveActionStore}. */
export type ReactiveActionStatus = 'error' | 'idle' | 'running' | 'success';

/**
 * Discriminated state of a {@link ReactiveActionStore}, keyed by {@link ReactiveActionStatus}.
 *
 * `data` holds the most recent successful result and persists through subsequent `running` and
 * `error` states so call sites can keep rendering stale content while a retry is in flight. Only
 * `reset()` clears it.
 */
export type ReactiveActionState<TResult> =
    | { readonly data: TResult | undefined; readonly error: undefined; readonly status: 'running' }
    | { readonly data: TResult | undefined; readonly error: unknown; readonly status: 'error' }
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
     */
    readonly dispatch: (...args: TArgs) => void;
    /**
     * Promise-returning dispatch for imperative callers. Resolves with the wrapped function's
     * result on success. Rejects with the thrown error on failure, and with an `AbortError` when
     * the call is superseded or `reset()` is invoked — filter those with `isAbortError` from
     * `@solana/promises`.
     */
    readonly dispatchAsync: (...args: TArgs) => Promise<TResult>;
    /** Returns the current state. */
    readonly getState: () => ReactiveActionState<TResult>;
    /** Aborts any in-flight dispatch and resets the state to `{ status: 'idle' }`. */
    readonly reset: () => void;
    /** Registers a listener called on every state change. Returns an unsubscribe function. */
    readonly subscribe: (listener: () => void) => () => void;
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
 * arguments were passed to `dispatch`.
 *
 * @typeParam TArgs - Argument tuple forwarded from `dispatch` to `fn`.
 * @typeParam TResult - Resolved value type of `fn`.
 * @param fn - Async function to wrap. Receives an {@link AbortSignal} plus the dispatch arguments.
 * @return A {@link ReactiveActionStore} exposing `dispatch`, `dispatchAsync`, `getState`, `subscribe`,
 * and `reset`.
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
 * // Or, when you need the resolved value imperatively:
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

    const dispatchAsync = async (...args: TArgs): Promise<TResult> => {
        currentController?.abort();
        const controller = new AbortController();
        currentController = controller;
        const { signal } = controller;
        const previousData = state.data;
        setState({ data: previousData, error: undefined, status: 'running' });
        try {
            const result = await getAbortablePromise(fn(signal, ...args), signal);
            if (signal.aborted) {
                throw signal.reason;
            }
            setState({ data: result, error: undefined, status: 'success' });
            return result;
        } catch (error) {
            if (signal.aborted) {
                throw signal.reason;
            }
            setState({ data: previousData, error, status: 'error' });
            throw error;
        }
    };

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
    };
}
