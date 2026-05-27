import { type Slot, splitSolanaRpcResponse, type UnwrapRpcResponse } from '@solana/kit';
import type { ReactiveStreamSource } from '@solana/subscribable';
import { useCallback, useRef } from 'react';
import type { Key as SWRKey, SWRConfiguration } from 'swr';
import useSWRSubscription, { type SWRSubscriptionOptions, type SWRSubscriptionResponse } from 'swr/subscription';

import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect';
import type { UseSubscriptionOptions } from '../useSubscription';

/**
 * The shape that the SWR-backed Kit subscription hooks surface as `data`. Mirrors core's
 * `{ data, slot }` top-level fields, flattened into the cache-friendly `data` slot that SWR
 * subscriptions provide. `slot` is `undefined` before the first envelope-shaped notification
 * arrives, and remains `undefined` for streams that emit raw, non-envelope values.
 *
 * @typeParam T - The unwrapped value type.
 */
export type SlotTaggedValue<T> = {
    slot: Slot | undefined;
    value: T;
};

/**
 * SWR-backed counterpart to `useSubscription`. Routes a `ReactiveStreamSource<T>` through SWR's
 * subscription cache (`useSWRSubscription`) so components reading the same `key` share one
 * underlying connection and participate in SWR's devtools / cache layer.
 *
 * Returns SWR's native `{ data, error }` shape. `data` is a {@link SlotTaggedValue} —
 * notifications shaped as `SolanaRpcResponse<U>` are unwrapped so `data.value` is the inner
 * value `U` and `data.slot` is lifted from `context.slot`. Raw notifications pass through with
 * `data.slot: undefined`.
 *
 * Pass `null` for `key` or `source` to disable.
 *
 * @typeParam T - The raw notification type emitted by the source.
 *
 * @example
 * ```tsx
 * function AccountBalance({ address }: { address: Address }) {
 *     const client = useClient<ClientWithRpcSubscriptions<AccountNotificationsApi>>();
 *     const { data } = useSubscriptionSwr(
 *         address ? ['account', address] : null,
 *         address ? client.rpcSubscriptions.accountNotifications(address) : null,
 *     );
 *     return <p>{data ? `${data.value.lamports} lamports at slot ${data.slot}` : 'Connecting…'}</p>;
 * }
 * ```
 */
export function useSubscriptionSwr<T>(
    key: SWRKey,
    source: ReactiveStreamSource<T> | null,
    options?: SWRConfiguration & UseSubscriptionOptions,
): SWRSubscriptionResponse<SlotTaggedValue<UnwrapRpcResponse<T>>, unknown> {
    const { getAbortSignal, ...swrConfig } = options ?? {};

    // Ref-sync the source and the abort-signal factory so an inline value passed each render
    // doesn't change the `subscribe` callback's identity. `subscribe` reads the latest values
    // from the refs when SWR invokes it.
    const sourceRef = useRef(source);
    const getAbortSignalRef = useRef(getAbortSignal);
    useIsomorphicLayoutEffect(() => {
        sourceRef.current = source;
        getAbortSignalRef.current = getAbortSignal;
    });

    const subscribe = useCallback(
        (_key: SWRKey, { next }: SWRSubscriptionOptions<SlotTaggedValue<UnwrapRpcResponse<T>>, unknown>) => {
            const current = sourceRef.current!;
            const store = current.reactiveStore();
            const unsubscribe = store.subscribe(() => {
                const state = store.getUnifiedState();
                if (state.status === 'loaded') {
                    const { slot, value } = splitSolanaRpcResponse(state.data);
                    next(null, { slot, value });
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

    // Force the key to `null` when there's no source — either-null disables the subscription.
    return useSWRSubscription<SlotTaggedValue<UnwrapRpcResponse<T>>, unknown, SWRKey>(
        source == null ? null : key,
        subscribe,
        swrConfig,
    );
}
