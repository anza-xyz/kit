import { RpcResponse } from '@solana/rpc-spec-types';

type Config = Readonly<{
    /** A value of arbitrary type to be sent to a RPC server */
    payload: unknown;
    /**
     * An optional `AbortSignal` on which the `'abort'` event will be fired if the request should be
     * cancelled.
     */
    signal?: AbortSignal;
}>;

/**
 * A function that can act as a transport for a {@link Rpc}. It need only return a promise for a
 * response given the supplied config.
 */
export type RpcTransport = {
    <TResponse>(config: Config): Promise<RpcResponse<TResponse>>;
};

/**
 * Returns `true` if the given payload is a JSON RPC v2 payload.
 *
 * This means, the payload is an object such that:
 *
 * - It has a `jsonrpc` property with a value of `'2.0'`.
 * - It has a `method` property that is a string.
 * - It has a `params` property of any type.
 *
 * @example
 * ```ts
 * import { isJsonRpcPayload } from '@solana/rpc-spec';
 *
 * if (isJsonRpcPayload(payload)) {
 *     const payloadMethod: string = payload.method;
 *     const payloadParams: unknown = payload.params;
 * }
 * ```
 */
export function isJsonRpcPayload(payload: unknown): payload is Readonly<{
    jsonrpc: '2.0';
    method: string;
    params: unknown;
}> {
    if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
        return false;
    }
    return (
        'jsonrpc' in payload &&
        payload.jsonrpc === '2.0' &&
        'method' in payload &&
        typeof payload.method === 'string' &&
        'params' in payload
    );
}
