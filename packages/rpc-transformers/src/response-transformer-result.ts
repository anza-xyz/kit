import { RpcResponseTransformer } from '@solana/rpc-spec-types';

type JsonRpcResponse = { result: unknown };

/**
 * Returns a transformer that extracts the `result` field from the body of the RPC response.
 *
 * For instance, we go from `{ jsonrpc: '2.0', result: 'foo', id: 1 }` to `'foo'`.
 *
 * @example
 * ```ts
 * import { getResultResponseTransformer } from '@solana/rpc-transformers';
 *
 * const responseTransformer = getResultResponseTransformer();
 * ```
 */
export function getResultResponseTransformer(): RpcResponseTransformer {
    return json => (json as JsonRpcResponse).result;
}
