/**
 * This package contains types that describe the implementation of the JSON RPC Subscriptions API,
 * as well as methods to create one. It can be used standalone, but it is also exported as part of
 * Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * @example
 * ```ts
 * const rpcSubscriptions =
 *     // Step 1 - Create a `RpcSubscriptions` instance. This may be stateful.
 *     createSolanaRpcSubscriptions(mainnet('wss://api.mainnet-beta.solana.com'));
 * const response = await rpcSubscriptions
 *     // Step 2 - Call supported methods on it to produce `PendingRpcSubscriptionsRequest` objects.
 *     .slotNotifications({ commitment: 'confirmed' })
 *     // Step 3 - Call the `subscribe()` method on those pending requests to trigger them.
 *     .subscribe({ abortSignal: AbortSignal.timeout(10_000) });
 * // Step 4 - Iterate over the result.
 * try {
 *     for await (const slotNotification of slotNotifications) {
 *         console.log('Got a slot notification', slotNotification);
 *     }
 * } catch (e) {
 *     console.error('The subscription closed unexpectedly', e);
 * } finally {
 *     console.log('We have stopped listening for notifications');
 * }
 * ```
 *
 * @packageDocumentation
 */
export * from './rpc-subscriptions-request';
export * from './rpc-subscriptions';
export * from './rpc-subscriptions-api';
export * from './rpc-subscriptions-channel';
export * from './rpc-subscriptions-pubsub-plan';
export * from './rpc-subscriptions-transport';
