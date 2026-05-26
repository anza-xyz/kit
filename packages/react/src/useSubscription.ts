import { ReactiveStreamSource } from '@solana/kit';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { disabledStreamStore } from './staticStores';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { useSubscriptionResult } from './useSubscriptionResult';

/**
 * Reactive state for a subscription managed by {@link useSubscription} (and other stream-store
 * hooks built on top of it).
 *
 * Lifecycle: starts at `loading` (or `disabled` when the source is `null`) and opens the
 * underlying stream on mount; transitions to `loaded` on the first notification or `error` on
 * failure. `reconnect()` re-opens the stream — while a reconnect is in flight, `status` returns
 * to `loading` and the stale `data` and/or `error` from the prior connection remain populated
 * (stale-while-revalidate).
 *
 * @typeParam T - The notification type emitted by the underlying source.
 */
export type SubscriptionResult<T> = {
    /**
     * The latest notification. `undefined` on the first load and while disabled. On `loading`
     * after a prior outcome, on `error`, and on a subsequent reconnect, holds the last
     * received notification.
     */
    data: T | undefined;
    /**
     * Error from the subscription, or `undefined`. On `loading` after a prior `error`, holds the
     * stale error so UIs can keep showing the failure context (e.g. a banner) while the
     * reconnect is in flight. A subsequent `loaded` clears it.
     */
    error: unknown;
    /**
     * Re-open the stream. By default each call mints a fresh signal from `getAbortSignal` (if
     * configured) and threads it through the underlying store's `withSignal(signal).connect()`.
     * Pass `{ abortSignal }` to override the configured factory for just this attempt. Pass
     * `{ abortSignal: undefined }` to opt out of the factory entirely for this attempt and open
     * with no caller-provided signal.
     *
     * Stable reference. Safe to put in `onClick` handlers or effect deps — typically wired up
     * to a "Reconnect" button when `status === 'error'`. Calls `store.connect()` under the
     * hood, so it always (re)opens the stream regardless of current status; the bridge
     * transitions back through `loading` while preserving stale data and error.
     */
    reconnect: (options?: { abortSignal?: AbortSignal | undefined }) => void;
    /**
     * Lifecycle status as a discriminated string:
     * - `loading`: a connection is in progress. On the first connection, `data` and `error` are
     *   `undefined`. After a reconnect, `data` and `error` hold the last known values from the
     *   previous connection (stale-while-revalidate).
     * - `loaded`: at least one notification has arrived.
     * - `error`: the subscription failed; `data` holds the last known value (if any).
     * - `disabled`: source was `null` — no subscription was opened.
     */
    status: 'disabled' | 'error' | 'loaded' | 'loading';
};

/** Options accepted by {@link useSubscription}. */
export type UseSubscriptionOptions = {
    /**
     * Factory invoked on every connection (initial subscribe + every `reconnect()`). The returned
     * signal is attached to that connection via the underlying store's
     * `withSignal(signal).connect()`, so aborting it tears down that connection.
     *
     * The most common use is per-connection timeouts:
     * `getAbortSignal: () => AbortSignal.timeout(30_000)` gives every connection its own
     * 30-second clock that resets on `reconnect()`.
     *
     * Held in a ref synced to the latest render's closure — there is no need to memoize an inline
     * factory.
     */
    getAbortSignal?: () => AbortSignal;
};

/**
 * Subscribe to a stream-store source and surface the latest notification as reactive state. The
 * subscription opens on mount, re-opens whenever `source` changes identity, and tears down on
 * unmount.
 *
 * Accepts any {@link ReactiveStreamSource} — the `{ reactiveStore() }` duck-type satisfied by
 * `PendingRpcSubscriptionsRequest` (e.g. `client.rpcSubscriptions.accountNotifications(addr)`)
 * and any plugin-authored stream object that follows the same convention. Pass `null` to
 * disable; the result reports `status: 'disabled'`.
 *
 * Memoize the source with `useMemo` keyed on whatever inputs it depends on; stable identity is
 * how the hook knows when to tear down and re-open.
 *
 * SSR-safe — on the server the connect effect doesn't run, so the store stays `idle` and the
 * hook reports `status: 'loading'`. The first client render hydrates from that same `loading`
 * paint, then commits the connect effect.
 *
 * @typeParam T - The notification type emitted by the source.
 *
 * @example
 * ```tsx
 * function AccountBalance({ address }: { address: Address }) {
 *     const client = useClient<ClientWithRpcSubscriptions<AccountNotificationsApi>>();
 *     const source = useMemo(() => client.rpcSubscriptions.accountNotifications(address), [client, address]);
 *     const { data, error, reconnect } = useSubscription(source);
 *     if (error) return <button onClick={reconnect}>Reconnect</button>;
 *     return <p>{data ? `${data.value.lamports} lamports at slot ${data.context.slot}` : 'Connecting…'}</p>;
 * }
 * ```
 *
 * @see {@link SubscriptionResult}
 * @see {@link UseSubscriptionOptions}
 */
export function useSubscription<T>(
    source: ReactiveStreamSource<T> | null,
    options?: UseSubscriptionOptions,
): SubscriptionResult<T> {
    // Ref-sync the per-connection factory so inline closures don't churn the memo below. Each
    // connection invokes the latest factory at connect time.
    const getAbortSignalRef = useRef(options?.getAbortSignal);
    useIsomorphicLayoutEffect(() => {
        getAbortSignalRef.current = options?.getAbortSignal;
    });

    // One store per `source`. Both creation paths return an `idle` store; the initial connect
    // lives in the effect below so the memo body stays pure (StrictMode's dev double-render, and
    // any future render-discard, won't open a subscription from a discarded render).
    const store = useMemo(() => {
        if (source == null) return disabledStreamStore<T>();
        return source.reactiveStore();
    }, [source]);

    // Initial connect on commit + teardown on store change / unmount. `disabledStreamStore`
    // returns a store whose `connect` and `reset` are no-ops, so this branch handles the null
    // source case without an explicit gate. `store.reset()` aborts the active connection via
    // the action store's internal controller — so under StrictMode's mount → cleanup → mount
    // sequence, the first connect is properly aborted before the second one fires.
    useEffect(() => {
        const signal = getAbortSignalRef.current?.();
        if (signal) store.withSignal(signal).connect();
        else store.connect();
        return () => store.reset();
    }, [store]);

    const reconnect = useCallback(
        (options?: { abortSignal?: AbortSignal | undefined }) => {
            // Presence-based override: an explicit `abortSignal` key (even `undefined`) opts out
            // of the factory for this attempt. Omitting the key falls back to the configured
            // factory.
            const signal = options && 'abortSignal' in options ? options.abortSignal : getAbortSignalRef.current?.();
            if (signal) store.withSignal(signal).connect();
            else store.connect();
        },
        [store],
    );

    return useSubscriptionResult(store, reconnect, source == null);
}
