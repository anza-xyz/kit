import { getBigIntUpcastVisitor } from './response-transformer-bigint-upcast-internal';
import { getTreeWalkerResponseTransformer, KeyPath } from './tree-traversal';

/**
 * Returns a transformer that upcasts all `Number` values to `BigInts` unless they match within the
 * provided {@link KeyPath | KeyPaths}. In other words, the provided {@link KeyPath | KeyPaths} will
 * remain as `Number` values, any other numeric value will be upcasted to a `BigInt`.
 *
 * Note that you can use {@link KEYPATH_WILDCARD} to match any key within a {@link KeyPath}.
 *
 * @example
 * ```ts
 * import { getBigIntUpcastResponseTransformer } from '@solana/rpc-transformers';
 *
 * const responseTransformer = getBigIntUpcastResponseTransformer([
 *     ['index'],
 *     ['instructions', KEYPATH_WILDCARD, 'accounts', KEYPATH_WILDCARD],
 *     ['instructions', KEYPATH_WILDCARD, 'programIdIndex'],
 *     ['instructions', KEYPATH_WILDCARD, 'stackHeight'],
 * ]);
 * ```
 */
export function getBigIntUpcastResponseTransformer(allowedNumericKeyPaths: readonly KeyPath[]) {
    return getTreeWalkerResponseTransformer([getBigIntUpcastVisitor(allowedNumericKeyPaths)], { keyPath: [] });
}
