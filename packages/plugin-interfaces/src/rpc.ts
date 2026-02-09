import type { Rpc } from '@solana/rpc-spec';
import type { RpcSubscriptions } from '@solana/rpc-subscriptions-spec';

/**
 * Represents a client that provides access to a Solana RPC endpoint.
 *
 * The RPC interface allows making JSON-RPC calls to a Solana validator,
 * such as fetching account data, sending transactions, and querying blockchain state.
 *
 * @typeParam TRpcMethods - The RPC methods available on this client. Use specific
 *            method types from `@solana/rpc-api` for the Solana JSON-RPC API.
 *
 * @example
 * ```ts
 * import { SolanaRpcApi } from '@solana/rpc-api';
 *
 * async function getBalance(client: ClientWithRpc<SolanaRpcApi>, address: Address) {
 *     const { value: balance } = await client.rpc.getBalance(address).send();
 *     return balance;
 * }
 * ```
 */
export type ClientWithRpc<TRpcMethods> = { rpc: Rpc<TRpcMethods> };

/**
 * Represents a client that provides access to Solana RPC subscriptions.
 *
 * RPC subscriptions enable real-time notifications from the Solana validator,
 * such as account changes, slot updates, and transaction confirmations.
 *
 * @typeParam TRpcSubscriptionsMethods - The subscription methods available on this client.
 *            Use specific method types from `@solana/rpc-subscriptions-api` for the Solana
 *            subscription API.
 *
 * @example
 * ```ts
 * import { SolanaRpcSubscriptionsApi } from '@solana/rpc-subscriptions-api';
 *
 * async function subscribeToAccount(
 *     client: ClientWithRpcSubscriptions<SolanaRpcSubscriptionsApi>,
 *     address: Address,
 * ) {
 *     const subscription = await client.rpcSubscriptions.accountNotifications(address).subscribe();
 *     for await (const notification of subscription) {
 *         console.log('Account changed:', notification);
 *     }
 * }
 * ```
 */
export type ClientWithRpcSubscriptions<TRpcSubscriptionsMethods> = {
    rpcSubscriptions: RpcSubscriptions<TRpcSubscriptionsMethods>;
};
