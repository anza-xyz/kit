import type { ReactiveStreamSource } from '@solana/kit';
import { useCallback, useRef } from 'react';
import type { Key as SWRKey, SWRConfiguration } from 'swr';
import useSWRSubscription, { type SWRSubscriptionOptions, type SWRSubscriptionResponse } from 'swr/subscription';

import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect';
import type { UseSubscriptionOptions } from '../useSubscription';

/**
 * SWR-backed counterpart to `useSubscription`. Routes a `ReactiveStreamSource<T>` through SWR's
 * subscription cache (`useSWRSubscription`) so components reading the same `key` share one
 * underlying connection and participate in SWR's devtools / cache layer.
 *
 * Returns SWR's native `{ data, error }` shape. `data` is the notification exactly as the source
 * emits it — no unwrapping. For RPC subscriptions that emit `SolanaRpcResponse<U>` envelopes
 * (`accountNotifications`, `programNotifications`, `signatureNotifications`), read the inner
 * value at `data.value` and the slot at `data.context.slot`. For raw notifications
 * (`slotNotifications`, `logsNotifications`, `rootNotifications`), `data` is the raw shape.
 *
 * Pass `null` for `key` or `source` to disable.
 *
 * @typeParam T - The notification type emitted by the source.
 *
 * @example
 * ```tsx
 * function AccountBalance({ address }: { address: Address }) {
 *     const client = useClient<ClientWithRpcSubscriptions<AccountNotificationsApi>>();
 *     const { data } = useSubscriptionSwr(
 *         address ? ['account', address] : null,
 *         address ? client.rpcSubscriptions.accountNotifications(address) : null,
 *     );
 *     return <p>{data ? `${data.value.lamports} lamports at slot ${data.context.slot}` : 'Connecting…'}</p>;
 * }
 * ```
 */
export function useSubscriptionSwr<T>(
    key: SWRKey,
    source: ReactiveStreamSource<T> | null,
    options?: SWRConfiguration & UseSubscriptionOptions,
): SWRSubscriptionResponse<T, unknown> {
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

    const subscribe = useCallback((_key: SWRKey, { next }: SWRSubscriptionOptions<T, unknown>) => {
        const current = sourceRef.current!;
        const store = current.reactiveStore();
        const unsubscribe = store.subscribe(() => {
            const state = store.getUnifiedState();
            if (state.status === 'loaded') {
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
    }, []);

    // Force the key to `null` when there's no source — either-null disables the subscription.
    return useSWRSubscription<T, unknown, SWRKey>(source == null ? null : key, subscribe, swrConfig);
}
