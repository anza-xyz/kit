import { getSolanaErrorFromJsonRpcError } from '@solana/errors';
import { RpcResponseTransformer } from '@solana/rpc-spec-types';

type JsonRpcResponse = { error: Parameters<typeof getSolanaErrorFromJsonRpcError>[0] } | { result: unknown };

/**
 * Returns a transformer that throws a {@link SolanaError} with the appropriate RPC error code if
 * the body of the RPC response contains an error.
 *
 * @example
 * ```ts
 * import { getThrowSolanaErrorResponseTransformer } from '@solana/rpc-transformers';
 *
 * const responseTransformer = getThrowSolanaErrorResponseTransformer();
 * ```
 */
export function getThrowSolanaErrorResponseTransformer(): RpcResponseTransformer {
    return json => {
        const jsonRpcResponse = json as JsonRpcResponse;
        if ('error' in jsonRpcResponse) {
            throw getSolanaErrorFromJsonRpcError(jsonRpcResponse.error);
        }
        return jsonRpcResponse;
    };
}
