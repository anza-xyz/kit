import { createReactiveActionStore } from '@solana/subscribable';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

// `useLayoutEffect` warns on the server. The ref-sync only needs to be in place by the time an
// event handler can fire, which can't happen during SSR — so on the server, plain `useEffect`
// is functionally equivalent and silent.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Reactive state and controls for an async action managed by {@link useAction}
 * (and plugin-specific hooks built on top of it).
 *
 * Lifecycle: starts at `idle`. Each `send(...)` flips to `running`, then to `success` or `error`
 * depending on the outcome. `data` from a prior `success` persists through subsequent `running`
 * states for stale-while-revalidate UX; only `reset()` clears it.
 *
 * Calling `send(...)` while a previous call is in flight aborts the first via its `AbortSignal`
 * and replaces it. Awaiters of the superseded call see a rejection with an `AbortError`,
 * filterable via `isAbortError` from `@solana/promises`.
 *
 * @typeParam TArgs - The argument tuple `send` accepts; forwarded to the wrapped function after
 *   the abort signal.
 * @typeParam TResult - The value the wrapped function resolves to on success.
 */
export type ActionResult<TArgs extends readonly unknown[], TResult> = {
    /** The result on success, or `undefined` if no successful call has happened yet. */
    data: TResult | undefined;
    /** The error on failure, or `undefined`. */
    error: unknown;
    /** `true` when `status === 'error'`. */
    isError: boolean;
    /** `true` when `status === 'idle'`. */
    isIdle: boolean;
    /** `true` when `status === 'running'` — a send is in flight. */
    isRunning: boolean;
    /** `true` when `status === 'success'`. */
    isSuccess: boolean;
    /** Reset state back to `idle`, aborting any in-flight call. Stable reference. */
    reset: () => void;
    /**
     * Trigger the action. Resolves with the wrapped function's result, or rejects with the thrown
     * error. Calling `send` again while a prior call is in flight aborts the first and rejects its
     * promise with an `AbortError`. Stable reference.
     *
     * Fire-and-forget callers can ignore the returned promise and render from `status` / `data` /
     * `error`. Awaiters that read the resolved value (e.g. to navigate on success) should filter
     * supersede rejections with `isAbortError` from `@solana/promises`.
     */
    send: (...args: TArgs) => Promise<TResult>;
    /**
     * The current lifecycle status as a discriminated string. The `isIdle` / `isRunning` /
     * `isSuccess` / `isError` booleans below are derived from this — pick whichever reads better
     * at the call site.
     */
    status: 'error' | 'idle' | 'running' | 'success';
};

/**
 * Bridge an arbitrary async function into a reactive {@link ActionResult}. Each `send(...)` call
 * runs the function with a fresh {@link AbortSignal} and tracks its lifecycle through React state;
 * a second call while a first is in flight aborts the first.
 *
 * `fn` is held in a ref that always points at the latest closure — there is no `deps` array to
 * maintain. Each `send(...)` invokes the most recently rendered `fn`, so values captured inside
 * (e.g. form state, route params) are always fresh without explicit dependency tracking. This
 * matches the convention used by `useMutation` in TanStack Query and `useWriteContract` in wagmi.
 * In-flight calls are unaffected — they continue with the closure they captured at dispatch time.
 *
 * @typeParam TArgs - The argument tuple `send` accepts; forwarded to `fn` after the abort signal.
 * @typeParam TResult - The value `fn` resolves to on success.
 *
 * @example
 * ```tsx
 * import { useAction } from '@solana/react';
 *
 * function PostMessageButton({ url, body }: { url: string; body: string }) {
 *     const { send, isRunning, error } = useAction(async (signal, content: string) => {
 *         const res = await fetch(url, { body: content, method: 'POST', signal });
 *         if (!res.ok) throw new Error(`HTTP ${res.status}`);
 *         return res.json() as Promise<{ id: string }>;
 *     });
 *     return (
 *         <button disabled={isRunning} onClick={() => send(body)}>
 *             {isRunning ? 'Posting…' : error ? 'Retry' : 'Post'}
 *         </button>
 *     );
 * }
 * ```
 *
 * @see {@link ActionResult}
 */
export function useAction<TArgs extends readonly unknown[], TResult>(
    fn: (signal: AbortSignal, ...args: TArgs) => Promise<TResult>,
): ActionResult<TArgs, TResult> {
    // Stable callback over the latest closure. Similar to `useEffectEvent`, but we need to
    // pass the callback to `createReactiveActionStore` so need to implement the pattern manually.
    const fnRef = useRef(fn);
    useIsomorphicLayoutEffect(() => {
        fnRef.current = fn;
    });

    // `createReactiveActionStore` only reads the callback when the returned `send` is called,
    // not during render. The `react-hooks/refs` rule doesn't know that, so we silence it here.
    // eslint-disable-next-line react-hooks/refs
    const [store] = useState(() =>
        createReactiveActionStore<TArgs, TResult>((signal, ...args) => fnRef.current(signal, ...args)),
    );

    // Reset on unmount so any in-flight call is aborted and state is dropped.
    useEffect(() => () => store.reset(), [store]);

    const state = useSyncExternalStore(store.subscribe, store.getState);

    return useMemo(
        () => ({
            data: state.data,
            error: state.error,
            isError: state.status === 'error',
            isIdle: state.status === 'idle',
            isRunning: state.status === 'running',
            isSuccess: state.status === 'success',
            reset: store.reset,
            send: store.dispatchAsync,
            status: state.status,
        }),
        [state, store],
    );
}
