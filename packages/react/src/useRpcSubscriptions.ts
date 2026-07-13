import type { ClientWithRpcSubscriptions, RpcSubscriptions, SolanaRpcSubscriptionsApi } from '@solana/kit';

import { useClientCapability } from './useClientCapability';

/**
 * Reads the RPC subscriptions client from the nearest {@link ClientProvider} and asserts at mount
 * that the `rpcSubscriptions` capability is installed.
 *
 * Wraps {@link useClientCapability}, so a client missing the RPC subscriptions plugin fails loudly
 * at mount with a {@link SolanaError} of code {@link SOLANA_ERROR__REACT__MISSING_CAPABILITY}
 * rather than surfacing later as an `undefined` access. Returns the client's `rpcSubscriptions`
 * object directly — its identity is owned by the provided client, so it is stable for that
 * client's lifetime and needs no memoization.
 *
 * @typeParam TRpcSubscriptionsMethods - The subscription method set the returned client exposes.
 *   Defaults to the full {@link SolanaRpcSubscriptionsApi}; narrow it to match the client you built.
 *
 * @example
 * ```tsx
 * import { useRpcSubscriptions } from '@solana/react';
 *
 * function AccountWatcher({ address }) {
 *     const rpcSubscriptions = useRpcSubscriptions();
 *     // ...call rpcSubscriptions.accountNotifications(address).subscribe() in an effect or with useSubscription, etc.
 * }
 * ```
 *
 * @see {@link useRpc}
 * @see {@link useClientCapability}
 */
export function useRpcSubscriptions<
    TRpcSubscriptionsMethods = SolanaRpcSubscriptionsApi,
>(): RpcSubscriptions<TRpcSubscriptionsMethods> {
    const client = useClientCapability<ClientWithRpcSubscriptions<TRpcSubscriptionsMethods>>({
        capability: 'rpcSubscriptions',
        hookName: 'useRpcSubscriptions',
        providerHint: 'Install `solanaRpcSubscriptions()` on the client.',
    });
    return client.rpcSubscriptions;
}
