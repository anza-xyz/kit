import { getBase58Decoder } from '@solana/codecs-strings';
import { SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX, SolanaError } from '@solana/errors';
import { getAbortablePromise } from '@solana/promises';

import { generateKeyPair } from './key-pair';

/**
 * A function or {@link RegExp} used to test whether a candidate base58-encoded
 * address produced from a generated key pair satisfies the grind criteria.
 *
 * - When a `RegExp` is provided, its literal characters (outside of escape
 *   sequences, character classes, quantifiers, and groups) are validated up
 *   front to ensure they are all in the base58 alphabet. This catches common
 *   typos like `/^ab0/` before any key generation takes place.
 * - When a function is provided, it is used as-is with no validation. Use this
 *   form when you need arbitrary matching logic that falls outside what a
 *   simple regex can express.
 *
 * @see {@link grindKeyPair}
 * @see {@link grindKeyPairs}
 */
export type GrindKeyPairMatches = RegExp | ((address: string) => boolean);

/**
 * Configuration object accepted by {@link grindKeyPairs}.
 *
 * @see {@link grindKeyPairs}
 * @see {@link GrindKeyPairMatches}
 */
export type GrindKeyPairsConfig = Readonly<{
    /**
     * An optional {@link AbortSignal} used to cancel the grind loop. When the
     * signal fires, the returned promise rejects immediately with the signal's
     * reason, even if a batch of key pair generations is still in flight (the
     * in-flight generations are abandoned in the background).
     */
    abortSignal?: AbortSignal;
    /**
     * The number of matching key pairs to return. Defaults to `1`. Values less
     * than or equal to `0` cause the function to return an empty array without
     * generating any key pairs (after validating the `matches` regex, if any).
     */
    amount?: number;
    /**
     * The number of key pairs to generate in parallel per batch. Defaults to
     * `32`. Higher values increase throughput at the cost of more memory
     * pressure per batch.
     */
    concurrency?: number;
    /**
     * Setting this to `true` makes it possible to extract the bytes of the
     * generated private keys using
     * [`crypto.subtle.exportKey()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey).
     * This value is forwarded to the inner {@link generateKeyPair} call and
     * defaults to `false`, which prevents the bytes of the private key from
     * being visible to JS.
     */
    extractable?: boolean;
    /**
     * Either a {@link RegExp} or a predicate function that tests candidate
     * base58-encoded addresses. See {@link GrindKeyPairMatches} for details.
     */
    matches: GrindKeyPairMatches;
}>;

// Matches regex parts that should be skipped during base58 validation:
//   - `\<any>` escape sequences
//   - `[...]` character classes
//   - `{...}` quantifiers
//   - `(...)` groups
const STRIP_UNVALIDATED_REGEX_PARTS = /\\.|\[[^\]]*\]|\{[^}]*\}|\([^)]*\)/g;

// Matches regex metacharacters and stray grouping delimiters that may remain
// after stripping the unvalidated parts above.
const STRIP_GRIND_METACHARACTERS = /[$()*+./?[\]^{|}]/g;

// Matches a string containing only characters from the base58 alphabet.
const BASE58_ALPHABET_REGEX = /^[1-9A-HJ-NP-Za-km-z]*$/;

/**
 * Validates that every top-level literal character in the provided regex is
 * part of the base58 alphabet used by Solana addresses. Characters inside
 * escape sequences, character classes, quantifiers, and groups are skipped
 * because they cannot be analyzed reliably without a full regex parser.
 *
 * When the regex has the `i` flag, a literal character is considered valid if
 * either its upper-case or lower-case form is in the base58 alphabet.
 *
 * Throws {@link SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX} on the first
 * invalid character encountered.
 */
function assertGrindRegexIsValid(regex: RegExp): void {
    const stripped = regex.source.replace(STRIP_UNVALIDATED_REGEX_PARTS, '').replace(STRIP_GRIND_METACHARACTERS, '');

    const isBase58Character = (character: string): boolean => {
        if (regex.ignoreCase) {
            return (
                BASE58_ALPHABET_REGEX.test(character.toLowerCase()) ||
                BASE58_ALPHABET_REGEX.test(character.toUpperCase())
            );
        }
        return BASE58_ALPHABET_REGEX.test(character);
    };

    for (const character of stripped) {
        if (!isBase58Character(character)) {
            throw new SolanaError(SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX, {
                character,
                source: regex.source,
            });
        }
    }
}

/**
 * Generates multiple Ed25519 key pairs whose base58-encoded public key
 * satisfies the provided `matches` criterion.
 *
 * Key pairs are generated in batches of `concurrency` in parallel and tested
 * against the matcher. The loop continues until `amount` matching key pairs
 * have been found or the provided `abortSignal` is aborted.
 *
 * When `matches` is a {@link RegExp}, its literal characters are validated
 * against the base58 alphabet up front to prevent infinite loops caused by
 * typos (e.g. `/^anza0/`). When `matches` is a function, it is used as-is
 * with no validation.
 *
 * @param config - See {@link GrindKeyPairsConfig}.
 * @returns A promise that resolves to an array of exactly `amount`
 * {@link CryptoKeyPair} instances, each of which satisfies the matcher. When
 * `amount <= 0`, the promise resolves to an empty array.
 *
 * @example
 * Find four key pairs whose address starts with `anza`:
 * ```ts
 * import { grindKeyPairs } from '@solana/keys';
 *
 * const keyPairs = await grindKeyPairs({ matches: /^anza/, amount: 4 });
 * ```
 *
 * @example
 * Use a predicate function for arbitrary matching logic:
 * ```ts
 * import { grindKeyPairs } from '@solana/keys';
 *
 * const keyPairs = await grindKeyPairs({
 *     matches: address => address.startsWith('anza') && address.endsWith('end'),
 *     amount: 2,
 * });
 * ```
 *
 * @example
 * Cancel a long-running grind using an {@link AbortSignal}:
 * ```ts
 * import { grindKeyPairs } from '@solana/keys';
 *
 * const keyPairs = await grindKeyPairs({
 *     matches: /^anza/,
 *     amount: 10,
 *     abortSignal: AbortSignal.timeout(60_000),
 * });
 * ```
 *
 * @see {@link grindKeyPair}
 */
export async function grindKeyPairs(config: GrindKeyPairsConfig): Promise<CryptoKeyPair[]> {
    const { abortSignal, amount = 1, concurrency = 32, extractable = false, matches } = config;

    let matcher: (address: string) => boolean;
    if (typeof matches === 'function') {
        matcher = matches;
    } else {
        assertGrindRegexIsValid(matches);
        matcher = address => matches.test(address);
    }

    if (amount <= 0) {
        return [];
    }

    const base58Decoder = getBase58Decoder();
    const found: CryptoKeyPair[] = [];

    while (found.length < amount) {
        abortSignal?.throwIfAborted();

        // Generate one batch of `concurrency` key pairs in parallel. The
        // batch is wrapped in `getAbortablePromise` so that cancellation
        // takes effect as soon as the signal fires, rather than waiting for
        // the in-flight key generations to settle.
        const batch = await getAbortablePromise(
            Promise.all(
                Array.from({ length: concurrency }, async () => {
                    const keyPair = await generateKeyPair(extractable);
                    const publicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
                    const address = base58Decoder.decode(publicKeyBytes);
                    return { address, keyPair };
                }),
            ),
            abortSignal,
        );

        for (const { address, keyPair } of batch) {
            if (found.length >= amount) break;
            if (matcher(address)) {
                found.push(keyPair);
            }
        }
    }

    return found;
}

/**
 * Generates a single Ed25519 key pair whose base58-encoded public key
 * satisfies the provided `matches` criterion. This is the main entry point
 * for mining vanity Solana addresses: the function keeps generating fresh
 * key pairs in parallel batches until one of them matches.
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
 * omitted because this function always returns a single key pair.
 *
 * @returns A promise that resolves to a {@link CryptoKeyPair} whose
 * base58-encoded public key satisfies the matcher.
 *
 * @throws {@link SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX} when the
 * provided regex contains a literal character that is not in the base58
 * alphabet.
 *
 * @throws The `AbortSignal`'s reason when the supplied `abortSignal` is
 * fired (either before the function is called or during the grind loop).
 *
 * @example
 * Mine a vanity address that starts with `anza`:
 * ```ts
 * import { grindKeyPair } from '@solana/keys';
 *
 * const keyPair = await grindKeyPair({ matches: /^anza/ });
 * ```
 *
 * @example
 * Use the `i` flag for case-insensitive matching:
 * ```ts
 * import { grindKeyPair } from '@solana/keys';
 *
 * const keyPair = await grindKeyPair({ matches: /^anza/i });
 * ```
 *
 * @example
 * Use a predicate function for arbitrary matching logic:
 * ```ts
 * import { grindKeyPair } from '@solana/keys';
 *
 * const keyPair = await grindKeyPair({
 *     matches: address => address.startsWith('anza') && address.length === 44,
 * });
 * ```
 *
 * @example
 * Cap the grind at 60 seconds using
 * [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static):
 * ```ts
 * import { grindKeyPair } from '@solana/keys';
 *
 * const keyPair = await grindKeyPair({
 *     matches: /^anza/,
 *     abortSignal: AbortSignal.timeout(60_000),
 * });
 * ```
 *
 * @example
 * Generate an extractable key pair so you can persist its private key bytes:
 * ```ts
 * import { grindKeyPair } from '@solana/keys';
 *
 * const keyPair = await grindKeyPair({ matches: /^anza/, extractable: true });
 * const privateKeyBytes = new Uint8Array(
 *     await crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
 * );
 * ```
 *
 * @see {@link grindKeyPairs}
 * @see {@link GrindKeyPairsConfig}
 * @see {@link GrindKeyPairMatches}
 * @see {@link generateKeyPair}
 */
export async function grindKeyPair(config: Omit<GrindKeyPairsConfig, 'amount'>): Promise<CryptoKeyPair> {
    const [keyPair] = await grindKeyPairs({ ...config, amount: 1 });
    return keyPair;
}
