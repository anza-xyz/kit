import { RpcRequest } from '@solana/rpc-spec-types';

import { getIntegerOverflowNodeVisitor } from './request-transformer-integer-overflow-internal';
import { getTreeWalkerRequestTransformer, KeyPath } from './tree-traversal';

export type IntegerOverflowHandler = (request: RpcRequest, keyPath: KeyPath, value: bigint) => void;

export function getIntegerOverflowRequestTransformer(onIntegerOverflow: IntegerOverflowHandler) {
    return <TParams>(request: RpcRequest<TParams>): RpcRequest => {
        const transformer = getTreeWalkerRequestTransformer(
            [getIntegerOverflowNodeVisitor((...args) => onIntegerOverflow(request, ...args))],
            { keyPath: [] },
        );
        return transformer(request);
    };
}
