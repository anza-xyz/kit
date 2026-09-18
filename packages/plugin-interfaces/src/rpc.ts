import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';
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

/**
 * Checks whether the provided client has an `rpc` installed.
 *
 * Only the presence of the `rpc` property is checked. The methods it supports cannot be verified
 * at runtime, so the caller vouches for them through the `TRpcMethods` type parameter.
 *
 * @typeParam TRpcMethods - The RPC methods the client is expected to support.
 * @param client - The client to check.
 * @return `true` if the client has an `rpc`, narrowing it to a {@link ClientWithRpc}.
 *
 * @example
 * ```ts
 * import { GetBalanceApi } from '@solana/rpc-api';
 *
 * if (isClientWithRpc<GetBalanceApi>(client)) {
 *     const { value: balance } = await client.rpc.getBalance(address).send();
 * }
 * ```
 *
 * @see {@link assertIsClientWithRpc}
 */
export function isClientWithRpc<TRpcMethods>(client: object): client is ClientWithRpc<TRpcMethods> {
    return Object.hasOwn(client, 'rpc');
}

/**
 * Asserts that the provided client has an `rpc` installed.
 *
 * Only the presence of the `rpc` property is checked. The methods it supports cannot be verified
 * at runtime, so the caller vouches for them through the `TRpcMethods` type parameter.
 *
 * @typeParam TRpcMethods - The RPC methods the client is expected to support.
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client has no `rpc`.
 *
 * @example
 * ```ts
 * import { GetBalanceApi } from '@solana/rpc-api';
 *
 * async function getBalance(client: object, address: Address) {
 *     assertIsClientWithRpc<GetBalanceApi>(client);
 *     const { value: balance } = await client.rpc.getBalance(address).send();
 *     return balance;
 * }
 * ```
 *
 * @see {@link isClientWithRpc}
 */
export function assertIsClientWithRpc<TRpcMethods>(client: object): asserts client is ClientWithRpc<TRpcMethods> {
    if (!isClientWithRpc(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['rpc'],
        });
    }
}

/**
 * Checks whether the provided client has `rpcSubscriptions` installed.
 *
 * Only the presence of the `rpcSubscriptions` property is checked. The subscription methods it
 * supports cannot be verified at runtime, so the caller vouches for them through the
 * `TRpcSubscriptionsMethods` type parameter.
 *
 * @typeParam TRpcSubscriptionsMethods - The subscription methods the client is expected to support.
 * @param client - The client to check.
 * @return `true` if the client has `rpcSubscriptions`, narrowing it to a
 * {@link ClientWithRpcSubscriptions}.
 *
 * @example
 * ```ts
 * import { SlotNotificationsApi } from '@solana/rpc-subscriptions-api';
 *
 * if (isClientWithRpcSubscriptions<SlotNotificationsApi>(client)) {
 *     const slotNotifications = await client.rpcSubscriptions.slotNotifications().subscribe({ abortSignal });
 * }
 * ```
 *
 * @see {@link assertIsClientWithRpcSubscriptions}
 */
export function isClientWithRpcSubscriptions<TRpcSubscriptionsMethods>(
    client: object,
): client is ClientWithRpcSubscriptions<TRpcSubscriptionsMethods> {
    return Object.hasOwn(client, 'rpcSubscriptions');
}

/**
 * Asserts that the provided client has `rpcSubscriptions` installed.
 *
 * Only the presence of the `rpcSubscriptions` property is checked. The subscription methods it
 * supports cannot be verified at runtime, so the caller vouches for them through the
 * `TRpcSubscriptionsMethods` type parameter.
 *
 * @typeParam TRpcSubscriptionsMethods - The subscription methods the client is expected to support.
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client has no `rpcSubscriptions`.
 *
 * @example
 * ```ts
 * import { SlotNotificationsApi } from '@solana/rpc-subscriptions-api';
 *
 * async function watchSlots(client: object, abortSignal: AbortSignal) {
 *     assertIsClientWithRpcSubscriptions<SlotNotificationsApi>(client);
 *     const slotNotifications = await client.rpcSubscriptions.slotNotifications().subscribe({ abortSignal });
 *     for await (const notification of slotNotifications) {
 *         console.log('New slot:', notification.slot);
 *     }
 * }
 * ```
 *
 * @see {@link isClientWithRpcSubscriptions}
 */
export function assertIsClientWithRpcSubscriptions<TRpcSubscriptionsMethods>(
    client: object,
): asserts client is ClientWithRpcSubscriptions<TRpcSubscriptionsMethods> {
    if (!isClientWithRpcSubscriptions(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['rpcSubscriptions'],
        });
    }
}
