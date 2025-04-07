import { RpcResponse } from '@solana/rpc-spec-types';
import { Dispatcher } from 'undici-types';

import { AllowedHttpRequestHeaders } from './http-transport-headers';

export type HttpTransportConfig = Readonly<{
    /**
     * In Node environments you can tune how requests are dispatched to the network. Use this config
     * parameter to install a
     * [`undici.Dispatcher`](https://undici.nodejs.org/#/docs/api/Agent) in your transport.
     *
     * @example
     * ```ts
     * import { createHttpTransport } from '@solana/rpc-transport-http';
     * import { Agent, BalancedPool } from 'undici';
     *
     * // Create a dispatcher that, when called with a special URL, creates a round-robin pool of RPCs.
     * const dispatcher = new Agent({
     *     factory(origin, opts) {
     *         if (origin === 'https://mypool') {
     *             const upstreams = [
     *                 'https://api.mainnet-beta.solana.com',
     *                 'https://mainnet.helius-rpc.com',
     *                 'https://several-neat-iguana.quiknode.pro',
     *             ];
     *             return new BalancedPool(upstreams, {
     *                 ...opts,
     *                 bodyTimeout: 60e3,
     *                 headersTimeout: 5e3,
     *                 keepAliveTimeout: 19e3,
     *             });
     *         } else {
     *             return new Pool(origin, opts);
     *         }
     *     },
     * });
     * const transport = createHttpTransport({
     *     dispatcher_NODE_ONLY: dispatcher,
     *     url: 'https://mypool',
     * });
     * let id = 0;
     * const balances = await Promise.allSettled(
     *     accounts.map(async account => {
     *         const response = await transport({
     *             payload: {
     *                 id: ++id,
     *                 jsonrpc: '2.0',
     *                 method: 'getBalance',
     *                 params: [account],
     *             },
     *         });
     *         return await response.json();
     *     }),
     * );
     * ```
     */
    dispatcher_NODE_ONLY?: Dispatcher;
    /**
     * An optional function that takes the response as a JSON string and converts it to a JSON
     * value.
     *
     * The request payload is also provided as a second argument.
     *
     * @defaultValue When not provided, the JSON value will be accessed via the `response.json()`
     * method of the fetch API.
     */
    fromJson?: (rawResponse: string, payload: unknown) => RpcResponse;
    /**
     * An object of headers to set on the request.
     *
     * Avoid
     * [forbidden headers](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name).
     * Additionally, the headers `Accept`, `Content-Length`, and `Content-Type` are disallowed.
     *
     * @example
     * ```ts
     * import { createHttpTransport } from '@solana/rpc-transport-http';
     *
     * const transport = createHttpTransport({
     *     headers: {
     *         // Authorize with the RPC using a bearer token
     *         Authorization: `Bearer ${process.env.RPC_AUTH_TOKEN}`,
     *     },
     *     url: 'https://several-neat-iguana.quiknode.pro',
     * });
     * ```
     */
    headers?: AllowedHttpRequestHeaders;
    /**
     * An optional function that takes the request payload and converts it to a JSON string.
     *
     * @defaultValue When not provided, `JSON.stringify` will be used.
     */
    toJson?: (payload: unknown) => string;
    /**
     * A string representing the target endpoint.
     *
     * In Node, it must be an absolute URL using the `http` or `https` protocol.
     */
    url: string;
}>;
