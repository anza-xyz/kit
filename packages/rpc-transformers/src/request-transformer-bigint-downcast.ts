import { downcastNodeToNumberIfBigint } from './request-transformer-bigint-downcast-internal';
import { getTreeWalkerRequestTransformer } from './tree-traversal';

/**
 * Creates a transformer that downcasts all `BigInt` values to `Number`.
 *
 * @deprecated This transformer is no longer used by the default Solana RPC request transformer
 * ({@link getDefaultRequestTransformerForSolanaRpc}). The Solana RPC transport serializes `bigint`
 * values losslessly as large integer literals (via `stringifyJsonWithBigInts`), and Agave parses
 * JSON integers across the full `u64` range without precision loss, so downcasting `bigint`s to
 * (potentially lossy) `number`s is unnecessary. It is slated for removal in a future major version.
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
