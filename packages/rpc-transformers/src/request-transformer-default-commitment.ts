import type { RpcRequest, RpcRequestTransformer } from '@solana/rpc-spec-types';
import type { Commitment } from '@solana/rpc-types';

import { applyDefaultCommitment } from './request-transformer-default-commitment-internal';

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
