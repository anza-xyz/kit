import { ReactiveActionSource } from '@solana/subscribable';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { disabledActionStore } from './staticStores';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { useRequestResult } from './useRequestResult';

/**
 * Reactive state for a one-shot request managed by {@link useRequest}.
 *
 * Lifecycle: starts at `loading` (or `disabled` when the source is `null`) and auto-fires on
 * mount; transitions to `loaded` on success or `error` on failure. `refresh()` re-fires the
 * request; while a refresh is in flight after a prior success, status is `retrying` and `data`
 * still holds the stale value (stale-while-revalidate).
 *
 * @typeParam T - The value the underlying request resolves to.
 */
export type RequestResult<T> = {
    /** The most recent successful value, or `undefined` while loading or when disabled. */
    data: T | undefined;
    /** The error from the most recent failed call, or `undefined`. */
    error: unknown;
    /** `true` only on the very first `loading` state — `false` during `retrying` so spinners don't replace stale content. */
    isLoading: boolean;
    /** Re-fire the request. Each call starts a fresh attempt with a fresh `perRequestSignal`. Stable reference. */
    refresh: () => void;
    /**
     * Lifecycle status as a discriminated string:
     * - `loading`: first call in flight, no data yet.
     * - `loaded`: call succeeded.
     * - `error`: call failed; `refresh()` will retry.
     * - `retrying`: re-fire after a prior success or error; `data` still holds the stale value.
     * - `disabled`: source was `null` — no request was fired.
     */
    status: 'disabled' | 'error' | 'loaded' | 'loading' | 'retrying';
};

/** Options accepted by {@link useRequest}. */
export type UseRequestOptions = {
    /**
     * Factory invoked on every attempt (initial fire + every `refresh()`). The returned signal is
     * passed through to the underlying `.reactiveStore({ perRequestSignal })` so aborting it
     * cancels just the current attempt.
     *
     * The most common use is per-attempt timeouts: `perRequestSignal: () => AbortSignal.timeout(5000)`
     * gives every attempt its own 5-second clock that resets on `refresh()`.
     *
     * Held in a ref synced to the latest render's closure — there is no need to memoize an inline
     * factory.
     */
    perRequestSignal?: () => AbortSignal;
};

/**
 * Fire a one-shot request on mount and re-fire each time `source` changes identity or `refresh()`
 * is called. Returns reactive state tracking the call's lifecycle.
 *
 * The hook accepts any {@link ReactiveActionSource} — the `{ reactiveStore() }` duck-type satisfied
 * by `PendingRpcRequest` and other plugin-authored pending objects (e.g. a DAS client's
 * `getAsset(address)`). Pass `null` to disable; the result reports `status: 'disabled'`.
 *
 * Memoize the source with `useMemo` keyed on whatever inputs it depends on. Stable identity is
 * how the hook knows when to re-fire — and because the deps live on a native `useMemo`,
 * `react-hooks/exhaustive-deps` catches stale closures by default.
 *
 * @typeParam T - The value the underlying request resolves to.
 *
 * @example
 * ```tsx
 * function LatestBlockhash() {
 *     const client = useClientCapability<ClientWithRpc<GetLatestBlockhashApi>>({
 *         capability: 'rpc',
 *         hookName: 'useLatestBlockhash',
 *         providerHint: 'Install `solanaRpc()` on the client.',
 *     });
 *     const source = useMemo(() => client.rpc.getLatestBlockhash(), [client]);
 *     const { data, error, refresh } = useRequest(source, {
 *         perRequestSignal: () => AbortSignal.timeout(5_000),
 *     });
 *     if (error) return <button onClick={refresh}>Retry</button>;
 *     return <p>{data ? `Blockhash: ${data.value.blockhash}` : 'Loading…'}</p>;
 * }
 * ```
 *
 * @see {@link RequestResult}
 * @see {@link UseRequestOptions}
 */
export function useRequest<T>(source: ReactiveActionSource<T> | null, options?: UseRequestOptions): RequestResult<T> {
    // Ref-sync the per-request factory so inline closures don't churn the memo below. Each
    // dispatch invokes the latest factory at fire time.
    const perRequestSignalRef = useRef(options?.perRequestSignal);
    useIsomorphicLayoutEffect(() => {
        perRequestSignalRef.current = options?.perRequestSignal;
    });

    // One store per `source`. `refresh()` dispatches on the same store — each dispatch calls the
    // factory again, so per-attempt signals stay fresh without rebuilding the store. The action
    // store's built-in stale-while-revalidate handles `data` across attempts.
    const store = useMemo(() => {
        if (source == null) return disabledActionStore<T>();
        // The factory closes over `perRequestSignalRef` and reads `.current` at dispatch time
        // (not during render). The `react-hooks/refs` rule can't see through the
        // closure-then-deferred-call pattern, so we silence it here.
        // eslint-disable-next-line react-hooks/refs
        return source.reactiveStore({
            perRequestSignal: () => perRequestSignalRef.current?.(),
        });
    }, [source]);

    // Tear down on source change / unmount. `store.reset()` aborts the in-flight network request
    // via the action store's internal controller.
    useEffect(() => () => store.reset(), [store]);

    const refresh = useCallback(() => store.dispatch(), [store]);

    return useRequestResult(store, refresh);
}
