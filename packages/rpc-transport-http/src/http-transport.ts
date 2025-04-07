import { SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, SolanaError } from '@solana/errors';
import type { RpcTransport } from '@solana/rpc-spec';
import type { RpcResponse } from '@solana/rpc-spec-types';
import type Dispatcher from 'undici-types/dispatcher';

import { HttpTransportConfig as Config } from './http-transport-config';
import { assertIsAllowedHttpRequestHeaders, normalizeHeaders } from './http-transport-headers';

let didWarnDispatcherWasSuppliedInNonNodeEnvironment = false;
function warnDispatcherWasSuppliedInNonNodeEnvironment() {
    if (didWarnDispatcherWasSuppliedInNonNodeEnvironment) {
        return;
    }
    didWarnDispatcherWasSuppliedInNonNodeEnvironment = true;
    console.warn(
        'You have supplied a `Dispatcher` to `createHttpTransport()`. It has been ignored ' +
            'because Undici dispatchers only work in Node environments. To eliminate this ' +
            'warning, omit the `dispatcher_NODE_ONLY` property from your config when running in ' +
            'a non-Node environment.',
    );
}

/**
 * Creates a function you can use to make `POST` requests with headers suitable for sending JSON
 * data to a server.
 *
 * @example
 * ```ts
 * import { createHttpTransport } from '@solana/rpc-transport-http';
 *
 * const transport = createHttpTransport({ url: 'https://api.mainnet-beta.solana.com' });
 * const response = await transport({
 *     payload: { id: 1, jsonrpc: '2.0', method: 'getSlot' },
 * });
 * const data = await response.json();
 * ```
 */
export function createHttpTransport(config: Config): RpcTransport {
    if (__DEV__ && !__NODEJS__ && 'dispatcher_NODE_ONLY' in config) {
        warnDispatcherWasSuppliedInNonNodeEnvironment();
    }
    const { fromJson, headers, toJson, url } = config;
    if (__DEV__ && headers) {
        assertIsAllowedHttpRequestHeaders(headers);
    }
    let dispatcherConfig: { dispatcher: Dispatcher | undefined } | undefined;
    if (__NODEJS__ && 'dispatcher_NODE_ONLY' in config) {
        dispatcherConfig = { dispatcher: config.dispatcher_NODE_ONLY };
    }
    const customHeaders = headers && normalizeHeaders(headers);
    return async function makeHttpRequest<TResponse>({
        payload,
        signal,
    }: Parameters<RpcTransport>[0]): Promise<RpcResponse<TResponse>> {
        const body = toJson ? toJson(payload) : JSON.stringify(payload);
        const requestInfo = {
            ...dispatcherConfig,
            body,
            headers: {
                ...customHeaders,
                // Keep these headers lowercase so they will override any user-supplied headers above.
                accept: 'application/json',
                'content-length': body.length.toString(),
                'content-type': 'application/json; charset=utf-8',
            },
            method: 'POST',
            signal,
        };
        const response = await fetch(url, requestInfo);
        if (!response.ok) {
            throw new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
                headers: response.headers,
                message: response.statusText,
                statusCode: response.status,
            });
        }
        if (fromJson) {
            return fromJson(await response.text(), payload) as TResponse;
        }
        return await response.json();
    };
}
