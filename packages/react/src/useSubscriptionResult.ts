import { splitSolanaRpcResponse, UnwrapRpcResponse } from '@solana/kit';
import { ReactiveStreamStore } from '@solana/subscribable';
import { useMemo, useSyncExternalStore } from 'react';

import { SubscriptionResult } from './useSubscription';

/**
 * Subscribes to a {@link ReactiveStreamStore} and maps its
 * `idle | loading | loaded | error` lifecycle onto the {@link SubscriptionResult} shape
 * consumed by `useSubscription`. Notifications shaped as `SolanaRpcResponse<U>` are unwrapped via
 * {@link splitSolanaRpcResponse} so `data` is the inner value and `slot` is lifted from
 * `context.slot`; raw notifications pass through unchanged with `slot: undefined`.
 *
 * `idle` is ambiguous on its own: it covers both "no source — store is disabled" and "real
 * source, connect effect hasn't fired yet on the current render." The `disabled` flag
 * disambiguates: disabled → `status: 'disabled'`, enabled → `status: 'loading'` (the connect
 * is about to fire on commit; consumers see a single `loading` paint rather than briefly
 * flashing `disabled`).
 *
 * Stale-while-revalidate flows naturally through `state.data` / `state.error`, which the store
 * preserves across `loading` transitions, so the bridge doesn't need to mirror them.
 *
 * @param store - The store to subscribe to.
 * @param reconnect - A stable callback that re-opens the stream. Forwarded to the result so call
 *   sites have a single, hook-owned recovery affordance.
 * @param disabled - When `true`, the result reports `status: 'disabled'`. Used by
 *   `useSubscription` to signal the null-source case.
 *
 * @internal
 */
export function useSubscriptionResult<T>(
    store: ReactiveStreamStore<T>,
    reconnect: (options?: { abortSignal?: AbortSignal | undefined }) => void,
    disabled: boolean,
): SubscriptionResult<UnwrapRpcResponse<T>> {
    const state = useSyncExternalStore(store.subscribe, store.getUnifiedState, store.getUnifiedState);
    return useMemo(() => {
        const { slot, value: data } = splitSolanaRpcResponse(state.data);
        const status: SubscriptionResult<UnwrapRpcResponse<T>>['status'] =
            state.status === 'idle' ? (disabled ? 'disabled' : 'loading') : state.status;
        return { data, error: state.error, reconnect, slot, status };
    }, [state, reconnect, disabled]);
}
