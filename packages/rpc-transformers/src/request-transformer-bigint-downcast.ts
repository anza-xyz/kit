import { downcastNodeToNumberIfBigint } from './request-transformer-bigint-downcast-internal';
import { getTreeWalkerRequestTransformer } from './tree-traversal';

/**
 * Creates a transformer that downcasts all `BigInt` values to `Number`.
 *
 * @example
 * ```ts
 * import { getBigIntDowncastRequestTransformer } from '@solana/rpc-transformers';
 *
 * const requestTransformer = getBigIntDowncastRequestTransformer();
 * ```
 *
 */
export function getBigIntDowncastRequestTransformer() {
    return getTreeWalkerRequestTransformer([downcastNodeToNumberIfBigint], { keyPath: [] });
}
