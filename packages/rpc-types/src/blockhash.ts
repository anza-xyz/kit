import {
    combineCodec,
    Decoder,
    Encoder,
    fixDecoderSize,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    fixEncoderSize,
    transformEncoder,
} from '@solana/codecs-core';
import { getBase58Decoder, getBase58Encoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__BLOCKHASH_STRING_LENGTH_OUT_OF_RANGE,
    SOLANA_ERROR__INVALID_BLOCKHASH_BYTE_LENGTH,
    SolanaError,
} from '@solana/errors';

export type Blockhash = string & { readonly __brand: unique symbol };

let memoizedBase58Encoder: Encoder<string> | undefined;
let memoizedBase58Decoder: Decoder<string> | undefined;

function getMemoizedBase58Encoder(): Encoder<string> {
    if (!memoizedBase58Encoder) memoizedBase58Encoder = getBase58Encoder();
    return memoizedBase58Encoder;
}

function getMemoizedBase58Decoder(): Decoder<string> {
    if (!memoizedBase58Decoder) memoizedBase58Decoder = getBase58Decoder();
    return memoizedBase58Decoder;
}

/**
 * A type guard that returns `true` if the input string conforms to the {@link Blockhash} type, and
 * refines its type for use in your program.
 *
 * @example
 * ```ts
 * import { isBlockhash } from '@solana/rpc-types';
 *
 * if (isBlockhash(blockhash)) {
 *     // At this point, `blockhash` has been refined to a
 *     // `Blockhash` that can be used with the RPC.
 *     const { value: isValid } = await rpc.isBlockhashValid(blockhash).send();
 *     setBlockhashIsFresh(isValid);
 * } else {
 *     setError(`${blockhash} is not a blockhash`);
 * }
 * ```
 */
export function isBlockhash(putativeBlockhash: string): putativeBlockhash is Blockhash {
    // Fast-path; see if the input string is of an acceptable length.
    if (
        // Lowest value (32 bytes of zeroes)
        putativeBlockhash.length < 32 ||
        // Highest value (32 bytes of 255)
        putativeBlockhash.length > 44
    ) {
        return false;
    }
    // Slow-path; actually attempt to decode the input string.
    const base58Encoder = getMemoizedBase58Encoder();
    const bytes = base58Encoder.encode(putativeBlockhash);
    const numBytes = bytes.byteLength;
    if (numBytes !== 32) {
        return false;
    }
    return true;
}

/**
 * From time to time you might acquire a string, that you expect to validate as a blockhash, from an
 * untrusted network API or user input. Use this function to assert that such an arbitrary string is
 * a base58-encoded blockhash.
 *
 * @example
 * ```ts
 * import { assertIsBlockhash } from '@solana/rpc-types';
 *
 * // Imagine a function that determines whether a blockhash is fresh when a user submits a form.
 * function handleSubmit() {
 *     // We know only that what the user typed conforms to the `string` type.
 *     const blockhash: string = blockhashInput.value;
 *     try {
 *         // If this type assertion function doesn't throw, then
 *         // Typescript will upcast `blockhash` to `Blockhash`.
 *         assertIsBlockhash(blockhash);
 *         // At this point, `blockhash` is a `Blockhash` that can be used with the RPC.
 *         const { value: isValid } = await rpc.isBlockhashValid(blockhash).send();
 *     } catch (e) {
 *         // `blockhash` turned out not to be a base58-encoded blockhash
 *     }
 * }
 * ```
 */
export function assertIsBlockhash(putativeBlockhash: string): asserts putativeBlockhash is Blockhash {
    // Fast-path; see if the input string is of an acceptable length.
    if (
        // Lowest value (32 bytes of zeroes)
        putativeBlockhash.length < 32 ||
        // Highest value (32 bytes of 255)
        putativeBlockhash.length > 44
    ) {
        throw new SolanaError(SOLANA_ERROR__BLOCKHASH_STRING_LENGTH_OUT_OF_RANGE, {
            actualLength: putativeBlockhash.length,
        });
    }
    // Slow-path; actually attempt to decode the input string.
    const base58Encoder = getMemoizedBase58Encoder();
    const bytes = base58Encoder.encode(putativeBlockhash);
    const numBytes = bytes.byteLength;
    if (numBytes !== 32) {
        throw new SolanaError(SOLANA_ERROR__INVALID_BLOCKHASH_BYTE_LENGTH, {
            actualLength: numBytes,
        });
    }
}

/**
 * Combines _asserting_ that a string is a blockhash with _coercing_ it to the {@link Blockhash}
 * type. It's most useful with untrusted input.
 *
 * @example
 * ```ts
 * import { blockhash } from '@solana/rpc-types';
 *
 * const { value: isValid } = await rpc.isBlockhashValid(blockhash(blockhashFromUserInput)).send();
 * ```
 *
 * > [!TIP]
 * > When starting from a known-good blockhash as a string, it's more efficient to typecast it
 * rather than to use the {@link blockhash} helper, because the helper unconditionally performs
 * validation on its input.
 * >
 * > ```ts
 * > import { Blockhash } from '@solana/rpc-types';
 * >
 * > const blockhash = 'ABmPH5KDXX99u6woqFS5vfBGSNyKG42SzpvBMWWqAy48' as Blockhash;
 * > ```
 */
export function blockhash(putativeBlockhash: string): Blockhash {
    assertIsBlockhash(putativeBlockhash);
    return putativeBlockhash;
}

/**
 * Returns an encoder that you can use to encode a base58-encoded blockhash to a byte array.
 *
 * @example
 * ```ts
 * import { getBlockhashEncoder } from '@solana/rpc-types';
 *
 * const blockhash = 'ABmPH5KDXX99u6woqFS5vfBGSNyKG42SzpvBMWWqAy48' as Blockhash;
 * const blockhashEncoder = getBlockhashEncoder();
 * const blockhashBytes = blockhashEncoder.encode(blockhash);
 * // Uint8Array(32) [
 * //   136, 123,  44, 249,  43,  19,  60,  14,
 * //   144,  16, 168, 241, 121, 111,  70, 232,
 * //   186,  26, 140, 202, 213,  64, 231,  82,
 * //   179,  66, 103, 237,  52, 117, 217,  93
 * // ]
 * ```
 */
export function getBlockhashEncoder(): FixedSizeEncoder<Blockhash, 32> {
    return transformEncoder(fixEncoderSize(getMemoizedBase58Encoder(), 32), putativeBlockhash =>
        blockhash(putativeBlockhash),
    );
}

/**
 * Returns a decoder that you can use to convert an array of 32 bytes representing a blockhash to
 * the base58-encoded representation of that blockhash.
 *
 * @example
 * ```ts
 * import { getBlockhashDecoder } from '@solana/rpc-types';
 *
 * const blockhashBytes = new Uint8Array([
 *     136, 123,  44, 249,  43,  19,  60,  14,
 *     144,  16, 168, 241, 121, 111,  70, 232,
 *     186,  26, 140, 202, 213,  64, 231,  82,
 *     179,  66, 103, 237,  52, 117, 217,  93
 * ]);
 * const blockhashDecoder = getBlockhashDecoder();
 * const blockhash = blockhashDecoder.decode(blockhashBytes); // ABmPH5KDXX99u6woqFS5vfBGSNyKG42SzpvBMWWqAy48
 * ```
 */
export function getBlockhashDecoder(): FixedSizeDecoder<Blockhash, 32> {
    return fixDecoderSize(getMemoizedBase58Decoder(), 32) as FixedSizeDecoder<Blockhash, 32>;
}

/**
 * Returns a codec that you can use to encode from or decode to a base-58 encoded blockhash.
 *
 * @see {@link getBlockhashDecoder}
 * @see {@link getBlockhashEncoder}
 */
export function getBlockhashCodec(): FixedSizeCodec<Blockhash, Blockhash, 32> {
    return combineCodec(getBlockhashEncoder(), getBlockhashDecoder());
}

export function getBlockhashComparator(): (x: string, y: string) => number {
    return new Intl.Collator('en', {
        caseFirst: 'lower',
        ignorePunctuation: false,
        localeMatcher: 'best fit',
        numeric: false,
        sensitivity: 'variant',
        usage: 'sort',
    }).compare;
}
