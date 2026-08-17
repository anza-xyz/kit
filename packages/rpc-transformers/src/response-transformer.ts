import { pipe } from '@solana/functional';
import { RpcRequest, RpcResponse, RpcResponseTransformer } from '@solana/rpc-spec-types';

import { AllowedNumericKeypaths } from './response-transformer-allowed-numeric-values';
import { getBigIntUpcastResponseTransformer } from './response-transformer-bigint-upcast';
import { getResultResponseTransformer } from './response-transformer-result';
import { getThrowSolanaErrorResponseTransformer } from './response-transformer-throw-solana-error';

export type ResponseTransformerConfig<TApi> = Readonly<{
    /**
     * An optional map from the name of an API method to an array of {@link KeyPath | KeyPaths}
     * pointing to values in the response that should materialize in the application as `Number`
     * instead of `BigInt`.
     */
    allowedNumericKeyPaths?: AllowedNumericKeypaths<TApi>;
}>;

/**
 * Returns the default response transformer for the Solana RPC API.
 *
 * Under the hood, this function composes multiple
 * {@link RpcResponseTransformer | RpcResponseTransformers} together such as the
 * {@link getThrowSolanaErrorResponseTransformer}, the {@link getResultResponseTransformer} and the
 * {@link getBigIntUpcastResponseTransformer}.
 *
 * @example
 * ```ts
 * import { getDefaultResponseTransformerForSolanaRpc } from '@solana/rpc-transformers';
 *
 * const responseTransformer = getDefaultResponseTransformerForSolanaRpc({
 *     allowedNumericKeyPaths: getAllowedNumericKeypaths(),
 * });
 * ```
 */
export function getDefaultResponseTransformerForSolanaRpc<TApi>(
    config?: ResponseTransformerConfig<TApi>,
): RpcResponseTransformer {
    return (response: RpcResponse, request: RpcRequest): RpcResponse => {
        const methodName = request.methodName as keyof TApi;
        const keyPaths =
            config?.allowedNumericKeyPaths && methodName ? config.allowedNumericKeyPaths[methodName] : undefined;
        return pipe(
            response,
            r => getThrowSolanaErrorResponseTransformer()(r, request),
            r => getResultResponseTransformer()(r, request),
            r => getBigIntUpcastResponseTransformer(keyPaths ?? [])(r, request),
        );
    };
}

/**
 * Map a subscribe request name (`blockSubscribe`) or a wire notification name
 * (`blockNotification`) onto the API key used by the numeric allow-list
 * (`blockNotifications`). Custom plan executors may still pass either form.
 *
 * The same mapping lives in `@solana/rpc-subscriptions-spec` as
 * `getApiMethodNameFromNotificationMethod`, kept local so that package does
 * not depend on this one. Update both if the wire naming changes.
 */
function toAllowedNumericMethodName(methodName: string): string {
    if (methodName.endsWith('Subscribe')) {
        return `${methodName.slice(0, -'Subscribe'.length)}Notifications`;
    }
    if (methodName.endsWith('Notification') && !methodName.endsWith('Notifications')) {
        return `${methodName}s`;
    }
    return methodName;
}

/**
 * Returns the default response transformer for the Solana RPC Subscriptions API.
 *
 * Under the hood, this function composes the {@link getBigIntUpcastResponseTransformer}.
 *
 * @example
 * ```ts
 * import { getDefaultResponseTransformerForSolanaRpcSubscriptions } from '@solana/rpc-transformers';
 *
 * const responseTransformer = getDefaultResponseTransformerForSolanaRpcSubscriptions({
 *     allowedNumericKeyPaths: getAllowedNumericKeypaths(),
 * });
 * ```
 */
export function getDefaultResponseTransformerForSolanaRpcSubscriptions<TApi>(
    config?: ResponseTransformerConfig<TApi>,
): RpcResponseTransformer {
    return (response: RpcResponse, request: RpcRequest): RpcResponse => {
        const methodName = toAllowedNumericMethodName(request.methodName) as keyof TApi;
        const keyPaths =
            config?.allowedNumericKeyPaths && methodName ? config.allowedNumericKeyPaths[methodName] : undefined;
        return pipe(response, r => getBigIntUpcastResponseTransformer(keyPaths ?? [])(r, request));
    };
}
