import { grindKeyPairs, GrindKeyPairsConfig } from '@solana/keys';

import { createSignerFromKeyPair, KeyPairSigner } from './keypair-signer';

/**
 * Generates multiple {@link KeyPairSigner | KeyPairSigners} whose addresses satisfy the
 * provided `matches` criterion. Internally, this calls
 * {@link grindKeyPairs} from `@solana/keys` and wraps each resulting
 * {@link CryptoKeyPair} in a {@link KeyPairSigner}.
 *
 * @param config - See {@link GrindKeyPairsConfig}.
 *
 * @example
 * Find four signers whose address starts with `anza`:
 * ```ts
 * import { grindKeyPairSigners } from '@solana/signers';
 *
 * const signers = await grindKeyPairSigners({ matches: /^anza/, amount: 4 });
 * ```
 *
 * @see {@link grindKeyPairSigner}
 * @see {@link grindKeyPairs}
 */
export async function grindKeyPairSigners(config: GrindKeyPairsConfig): Promise<KeyPairSigner[]> {
    const keyPairs = await grindKeyPairs(config);
    return await Promise.all(keyPairs.map(createSignerFromKeyPair));
}

/**
 * Generates a single {@link KeyPairSigner} whose address satisfies the
 * provided `matches` criterion. This is the main entry point for mining
 * vanity signers: the function keeps generating fresh key pairs in parallel
 * batches until one of them matches, and then wraps the result in a
 * {@link KeyPairSigner}.
 *
 * When `matches` is a {@link RegExp}, its literal characters (outside of
 * escape sequences, character classes, quantifiers, and groups) are
 * validated against the base58 alphabet up front. This catches common typos
 * such as `/^ab0/` (`0` is not in the base58 alphabet) before any key is
 * generated, preventing a guaranteed infinite loop.
 *
 * When `matches` is a function, it is used as-is with no validation — use
 * this form when you need arbitrary matching logic that cannot be expressed
 * as a regex. Be mindful that if the function can never return `true`, the
 * grind loop will never terminate unless you supply an {@link AbortSignal}.
 *
 * @param config - See {@link GrindKeyPairsConfig}. The `amount` field is
 * omitted because this function always returns a single signer.
 *
 * @returns A promise that resolves to a {@link KeyPairSigner} whose
 * base58-encoded address satisfies the matcher.
 *
 * @throws {@link SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX} when the
 * provided regex contains a literal character that is not in the base58
 * alphabet.
 *
 * @throws The `AbortSignal`'s reason when the supplied `abortSignal` is
 * fired (either before the function is called or during the grind loop).
 *
 * @example
 * Mine a vanity signer whose address starts with `anza`:
 * ```ts
 * import { grindKeyPairSigner } from '@solana/signers';
 *
 * const signer = await grindKeyPairSigner({ matches: /^anza/ });
 * ```
 *
 * @example
 * Use the `i` flag for case-insensitive matching:
 * ```ts
 * import { grindKeyPairSigner } from '@solana/signers';
 *
 * const signer = await grindKeyPairSigner({ matches: /^anza/i });
 * ```
 *
 * @example
 * Use a predicate function for arbitrary matching logic:
 * ```ts
 * import { grindKeyPairSigner } from '@solana/signers';
 *
 * const signer = await grindKeyPairSigner({
 *     matches: address => address.startsWith('anza') && address.length === 44,
 * });
 * ```
 *
 * @example
 * Cap the grind at 60 seconds using
 * [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static):
 * ```ts
 * import { grindKeyPairSigner } from '@solana/signers';
 *
 * const signer = await grindKeyPairSigner({
 *     matches: /^anza/,
 *     abortSignal: AbortSignal.timeout(60_000),
 * });
 * ```
 *
 * @see {@link grindKeyPairSigners}
 * @see {@link GrindKeyPairsConfig}
 */
export async function grindKeyPairSigner(config: Omit<GrindKeyPairsConfig, 'amount'>): Promise<KeyPairSigner> {
    const [signer] = await grindKeyPairSigners({ ...config, amount: 1 });
    return signer;
}
