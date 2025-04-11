import { downcastNodeToNumberIfBigint } from './request-transformer-bigint-downcast-internal';
import { getTreeWalkerRequestTransformer } from './tree-traversal';

export function getBigIntDowncastRequestTransformer() {
    return getTreeWalkerRequestTransformer([downcastNodeToNumberIfBigint], { keyPath: [] });
}
