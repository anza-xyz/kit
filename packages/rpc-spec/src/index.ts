/**
 * This package contains types that describe the implementation of the JSON RPC API, as well as
 * methods to create one. It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * This API is designed to be used as follows:
 *
 * ```ts
 * const rpc =
 *     // Step 1 - Create a `Rpc` instance. This may be stateful.
 *     createSolanaRpc(mainnet('https://api.mainnet-beta.solana.com'));
 * const response = await rpc
 *     // Step 2 - Call supported methods on it to produce `PendingRpcRequest` objects.
 *     .getLatestBlockhash({ commitment: 'confirmed' })
 *     // Step 3 - Call the `send()` method on those pending requests to trigger them.
 *     .send({ abortSignal: AbortSignal.timeout(10_000) });
 * ```
 *
 * @packageDocumentation
 */
export * from './rpc';
export * from './rpc-api';
export * from './rpc-transport';
