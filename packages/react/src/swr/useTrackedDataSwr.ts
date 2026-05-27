import { createReactiveStoreWithInitialValueAndSlotTracking, type SolanaRpcResponse } from '@solana/kit';
import { useCallback, useMemo, useRef } from 'react';
import type { Key as SWRKey, SWRConfiguration } from 'swr';
import useSWRSubscription, { type SWRSubscriptionOptions, type SWRSubscriptionResponse } from 'swr/subscription';

import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect';
import type { TrackedDataSpec, UseTrackedDataOptions } from '../useTrackedData';

/**
 * SWR-backed counterpart to `useTrackedData`. Pairs a one-shot RPC fetch with an ongoing
 * subscription (slot-deduped by the underlying Kit primitive) and routes the unified stream
 * through SWR's subscription cache so components reading the same `key` share one underlying
 * connection and participate in SWR's cache and devtools.
 *
 * Returns SWR's native `{ data, error }` shape. `data` is the `SolanaRpcResponse<TItem>` envelope
 * emitted by the underlying kit primitive — the primitive's type guarantees the envelope shape,
 * so callers can read `data.value` (the unified item produced by the spec's mappers) and
 * `data.context.slot` (the slot the store dedup'd on) directly.
 *
 * Pass `null` for `key` or `spec` to disable. Mirrors `useTrackedData`'s nullable-spec pattern.
 *
 * @typeParam TRpcValue - The value inside the initial RPC `SolanaRpcResponse` envelope.
 * @typeParam TSubscriptionValue - The value inside subscription `SolanaRpcResponse` notifications.
 * @typeParam TItem - The unified item type produced by the two mappers and surfaced as `data.value`.
 *
 * @example
 * ```tsx
 * function AccountBalance({ address }: { address: Address }) {
 *     const client = useClient<ClientWithRpc<GetBalanceApi> & ClientWithRpcSubscriptions<AccountNotificationsApi>>();
 *     const spec = useMemo(() => address ? ({
 *         rpcRequest: client.rpc.getBalance(address),
 *         rpcSubscriptionRequest: client.rpcSubscriptions.accountNotifications(address),
 *         rpcValueMapper: (lamports: bigint) => lamports,
 *         rpcSubscriptionValueMapper: ({ lamports }: { lamports: bigint }) => lamports,
 *     }) : null, [client, address]);
 *     const { data } = useTrackedDataSwr(address ? ['balance', address] : null, spec);
 *     return <p>{data ? `${data.value} lamports at slot ${data.context.slot}` : 'Loading…'}</p>;
 * }
 * ```
 */
export function useTrackedDataSwr<TRpcValue, TSubscriptionValue, TItem>(
    key: SWRKey,
    spec: TrackedDataSpec<TRpcValue, TSubscriptionValue, TItem> | null,
    options?: SWRConfiguration & UseTrackedDataOptions,
): SWRSubscriptionResponse<SolanaRpcResponse<TItem>, unknown> {
    const { getAbortSignal, ...swrConfig } = options ?? {};

    // Ref-sync the spec and the abort-signal factory. The `subscribe` callback is stable; it
    // reads the latest values from refs when SWR invokes it.
    const specRef = useRef(spec);
    const getAbortSignalRef = useRef(getAbortSignal);
    useIsomorphicLayoutEffect(() => {
        specRef.current = spec;
        getAbortSignalRef.current = getAbortSignal;
    });

    const subscribe = useCallback(
        (_key: SWRKey, { next }: SWRSubscriptionOptions<SolanaRpcResponse<TItem>, unknown>) => {
            const currentSpec = specRef.current!;
            const store = createReactiveStoreWithInitialValueAndSlotTracking(currentSpec);
            const unsubscribe = store.subscribe(() => {
                const state = store.getUnifiedState();
                if (state.status === 'loaded') {
                    // The kit primitive always emits `SolanaRpcResponse<TItem>` — pass it through.
                    next(null, state.data);
                } else if (state.status === 'error') {
                    next(state.error);
                }
            });
            const userSignal = getAbortSignalRef.current?.();
            if (userSignal) store.withSignal(userSignal).connect();
            else store.connect();
            return () => {
                unsubscribe();
                store.reset();
            };
        },
        [],
    );

    // Force the key to `null` when there's no spec — either-null disables.
    const effectiveKey = useMemo(() => (spec == null ? null : key), [spec, key]);

    return useSWRSubscription<SolanaRpcResponse<TItem>, unknown, SWRKey>(effectiveKey, subscribe, swrConfig);
}
