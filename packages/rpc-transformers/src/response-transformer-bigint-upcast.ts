import { getBigIntUpcastVisitor } from './response-transformer-bigint-upcast-internal';
import { getTreeWalkerResponseTransformer, KeyPath } from './tree-traversal';

export function getBigIntUpcastResponseTransformer(allowedNumericKeyPaths: readonly KeyPath[]) {
    return getTreeWalkerResponseTransformer([getBigIntUpcastVisitor(allowedNumericKeyPaths)], { keyPath: [] });
}
