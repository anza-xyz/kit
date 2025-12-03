import type { RpcRequest, RpcRequestTransformer } from '@solana/rpc-spec-types';
import type { Commitment } from '@solana/rpc-types';

import { applyDefaultCommitment } from './request-transformer-default-commitment-internal';

/**
 * Creates a transformer that adds the provided default commitment to the configuration object of the request when applicable.
 *
 * @param config
 *
 * @example
 * ```ts
 * import { getDefaultCommitmentRequestTransformer, OPTIONS_OBJECT_POSITION_BY_METHOD } from '@solana/rpc-transformers';
 *
 * const requestTransformer = getDefaultCommitmentRequestTransformer({
 *     defaultCommitment: 'confirmed',
 *     optionsObjectPositionByMethod: OPTIONS_OBJECT_POSITION_BY_METHOD,
 * });
 */
export function getDefaultCommitmentRequestTransformer({
    defaultCommitment,
    optionsObjectPositionByMethod,
}: Readonly<{
    defaultCommitment?: Commitment;
    optionsObjectPositionByMethod: Record<string, number>;
}>): RpcRequestTransformer {
    return <TParams>(request: RpcRequest<TParams>): RpcRequest => {
        const { params, methodName } = request;

        // We only apply default commitment to array parameters.
        if (!Array.isArray(params)) {
            return request;
        }

        // Find the position of the options object in the parameters and abort if not found.
        const optionsObjectPositionInParams = optionsObjectPositionByMethod[methodName];
        if (optionsObjectPositionInParams == null) {
            return request;
        }

        return Object.freeze({
            methodName,
            params: applyDefaultCommitment({
                commitmentPropertyName: methodName === 'sendTransaction' ? 'preflightCommitment' : 'commitment',
                optionsObjectPositionInParams,
                overrideCommitment: defaultCommitment,
                params,
            }),
        });
    };
}
