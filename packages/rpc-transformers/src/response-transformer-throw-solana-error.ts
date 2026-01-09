import { getSolanaErrorFromJsonRpcError } from '@solana/errors';
import { RpcResponseTransformer } from '@solana/rpc-spec-types';

import { innerInstructionsConfigs, jsonParsedAccountsConfigs } from './response-transformer-allowed-numeric-values';
import { getBigIntUpcastVisitor } from './response-transformer-bigint-upcast-internal';
import { getTreeWalkerResponseTransformer, KeyPath, KEYPATH_WILDCARD } from './tree-traversal';

type JsonRpcResponse = { error: Parameters<typeof getSolanaErrorFromJsonRpcError>[0] } | { result: unknown };

// Keypaths for simulateTransaction result that should remain as Number (not BigInt)
// Note: These are relative to the error.data root, not result.value like in success responses
function getSimulateTransactionAllowedNumericKeypaths(): readonly KeyPath[] {
    return [
        ['loadedAccountsDataSize'],
        ...jsonParsedAccountsConfigs.map(c => ['accounts', KEYPATH_WILDCARD, ...c]),
        ...innerInstructionsConfigs.map(c => ['innerInstructions', KEYPATH_WILDCARD, ...c]),
    ];
}

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
    return (json, request) => {
        const jsonRpcResponse = json as JsonRpcResponse;
        if ('error' in jsonRpcResponse) {
            const { error } = jsonRpcResponse;

            // Check if this is a sendTransaction preflight failure (error code -32002)
            // These errors contain RpcSimulateTransactionResult in error.data which needs
            // BigInt values downcast to Number for fields that should be numbers
            const isSendTransactionPreflightFailure =
                error &&
                typeof error === 'object' &&
                'code' in error &&
                (error.code === -32002 || error.code === -32002n);

            if (isSendTransactionPreflightFailure && 'data' in error && error.data) {
                // Apply BigInt downcast transformation to error.data
                const treeWalker = getTreeWalkerResponseTransformer(
                    [getBigIntUpcastVisitor(getSimulateTransactionAllowedNumericKeypaths())],
                    { keyPath: [] },
                );
                const transformedData = treeWalker(error.data, request);

                // Reconstruct error with transformed data
                const transformedError = { ...error, data: transformedData };
                throw getSolanaErrorFromJsonRpcError(transformedError);
            }

            throw getSolanaErrorFromJsonRpcError(jsonRpcResponse.error);
        }
        return jsonRpcResponse;
    };
}
