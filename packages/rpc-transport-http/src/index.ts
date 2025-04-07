/**
 * This package allows developers to create custom RPC transports. Using these primitives,
 * developers can create custom transports that perform transforms on messages sent and received,
 * attempt retries, and implement routing strategies between multiple transports.
 *
 * ## Augmenting Transports
 *
 * Using this core transport, you can implement specialized functionality for leveraging multiple
 * transports, attempting/handling retries, and more.
 *
 * ### Round Robin
 *
 * Here’s an example of how someone might implement a “round robin” approach to distribute requests
 * to multiple transports:
 *
 * ```ts
 * import { RpcTransport } from '@solana/rpc-spec';
 * import { RpcResponse } from '@solana/rpc-spec-types';
 * import { createHttpTransport } from '@solana/rpc-transport-http';
 *
 * // Create a transport for each RPC server
 * const transports = [
 *     createHttpTransport({ url: 'https://mainnet-beta.my-server-1.com' }),
 *     createHttpTransport({ url: 'https://mainnet-beta.my-server-2.com' }),
 *     createHttpTransport({ url: 'https://mainnet-beta.my-server-3.com' }),
 * ];
 *
 * // Create a wrapper transport that distributes requests to them
 * let nextTransport = 0;
 * async function roundRobinTransport<TResponse>(...args: Parameters<RpcTransport>): Promise<RpcResponse<TResponse>> {
 *     const transport = transports[nextTransport];
 *     nextTransport = (nextTransport + 1) % transports.length;
 *     return await transport(...args);
 * }
 * ```
 *
 * ### Sharding
 *
 * Another example of a possible customization for a transport is to shard requests
 * deterministically among a set of servers. Here’s an example:
 *
 * Perhaps your application needs to make a large number of requests, or needs to fan request for
 * different methods out to different servers. Here’s an example of an implementation that does the
 * latter:
 *
 * ```ts
 * import { RpcTransport } from '@solana/rpc-spec';
 * import { RpcResponse } from '@solana/rpc-spec-types';
 * import { createHttpTransport } from '@solana/rpc-transport-http';
 *
 * // Create multiple transports
 * const transportA = createHttpTransport({ url: 'https://mainnet-beta.my-server-1.com' });
 * const transportB = createHttpTransport({ url: 'https://mainnet-beta.my-server-2.com' });
 * const transportC = createHttpTransport({ url: 'https://mainnet-beta.my-server-3.com' });
 * const transportD = createHttpTransport({ url: 'https://mainnet-beta.my-server-4.com' });
 *
 * // Function to determine which shard to use based on the request method
 * function selectShard(method: string): RpcTransport {
 *     switch (method) {
 *         case 'getAccountInfo':
 *         case 'getBalance':
 *             return transportA;
 *         case 'getLatestBlockhash':
 *         case 'getTransaction':
 *             return transportB;
 *         case 'sendTransaction':
 *             return transportC;
 *         default:
 *             return transportD;
 *     }
 * }
 *
 * async function shardingTransport<TResponse>(...args: Parameters<RpcTransport>): Promise<RpcResponse<TResponse>> {
 *     const payload = args[0].payload as { method: string };
 *     const selectedTransport = selectShard(payload.method);
 *     return await selectedTransport(...args);
 * }
 * ```
 *
 * ### Retry Logic
 *
 * The transport library can also be used to implement custom retry logic on any request:
 *
 * ```ts
 * import { RpcTransport } from '@solana/rpc-spec';
 * import { RpcResponse } from '@solana/rpc-spec-types';
 * import { createHttpTransport } from '@solana/rpc-transport-http';
 *
 * // Set the maximum number of attempts to retry a request
 * const MAX_ATTEMPTS = 4;
 *
 * // Create the default transport
 * const defaultTransport = createHttpTransport({ url: 'https://mainnet-beta.my-server-1.com' });
 *
 * // Sleep function to wait for a given number of milliseconds
 * function sleep(ms: number): Promise<void> {
 *     return new Promise(resolve => setTimeout(resolve, ms));
 * }
 *
 * // Calculate the delay for a given attempt
 * function calculateRetryDelay(attempt: number): number {
 *     // Exponential backoff with a maximum of 1.5 seconds
 *     return Math.min(100 * Math.pow(2, attempt), 1500);
 * }
 *
 * // A retrying transport that will retry up to `MAX_ATTEMPTS` times before failing
 * async function retryingTransport<TResponse>(...args: Parameters<RpcTransport>): Promise<RpcResponse<TResponse>> {
 *     let requestError;
 *     for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
 *         try {
 *             return await defaultTransport(...args);
 *         } catch (err) {
 *             requestError = err;
 *             // Only sleep if we have more attempts remaining
 *             if (attempts < MAX_ATTEMPTS - 1) {
 *                 const retryDelay = calculateRetryDelay(attempts);
 *                 await sleep(retryDelay);
 *             }
 *         }
 *     }
 *     throw requestError;
 * }
 * ```
 *
 * ### Failover
 *
 * Here’s an example of some failover logic integrated into a transport:
 *
 * ```ts
 * import { RpcTransport } from '@solana/rpc-spec';
 * import { RpcResponse } from '@solana/rpc-spec-types';
 * import { createHttpTransport } from '@solana/rpc-transport-http';
 *
 * // Create a transport for each RPC server
 * const transports = [
 *     createHttpTransport({ url: 'https://mainnet-beta.my-server-1.com' }),
 *     createHttpTransport({ url: 'https://mainnet-beta.my-server-2.com' }),
 *     createHttpTransport({ url: 'https://mainnet-beta.my-server-2.com' }),
 * ];
 *
 * // A failover transport that will try each transport in order until one succeeds before failing
 * async function failoverTransport<TResponse>(...args: Parameters<RpcTransport>): Promise<RpcResponse<TResponse>> {
 *     let requestError;
 *
 *     for (const transport of transports) {
 *         try {
 *             return await transport(...args);
 *         } catch (err) {
 *             requestError = err;
 *             console.error(err);
 *         }
 *     }
 *     throw requestError;
 * }
 * ```
 *
 * @packageDocumentation
 */
export * from './http-transport';
export * from './http-transport-for-solana-rpc';
