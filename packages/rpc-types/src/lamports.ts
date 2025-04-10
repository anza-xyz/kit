import {
    Codec,
    combineCodec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    transformDecoder,
} from '@solana/codecs-core';
import { getU64Decoder, getU64Encoder, NumberCodec, NumberDecoder, NumberEncoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE, SolanaError } from '@solana/errors';

/**
 * Represents an integer value denominated in Lamports (ie. $1 \times 10^{-9}$ ◎).
 *
 * It is represented as a `bigint` in client code and an `u64` in server code.
 */
export type Lamports = bigint & { readonly __brand: unique symbol };

// Largest possible value to be represented by a u64
const maxU64Value = 18446744073709551615n; // 2n ** 64n - 1n

let memoizedU64Encoder: FixedSizeEncoder<bigint | number, 8> | undefined;
let memoizedU64Decoder: FixedSizeDecoder<bigint, 8> | undefined;

function getMemoizedU64Encoder(): FixedSizeEncoder<bigint | number, 8> {
    if (!memoizedU64Encoder) memoizedU64Encoder = getU64Encoder();
    return memoizedU64Encoder;
}

function getMemoizedU64Decoder(): FixedSizeDecoder<bigint, 8> {
    if (!memoizedU64Decoder) memoizedU64Decoder = getU64Decoder();
    return memoizedU64Decoder;
}

/**
 * This is a type guard that accepts a `bigint` as input. It will both return `true` if the integer
 * conforms to the {@link Lamports} type and will refine the type for use in your program.
 *
 * @example
 * ```ts
 * import { isLamports } from '@solana/rpc-types';
 *
 * if (isLamports(lamports)) {
 *     // At this point, `lamports` has been refined to a
 *     // `Lamports` that can be used anywhere Lamports are expected.
 *     await transfer(fromAddress, toAddress, lamports);
 * } else {
 *     setError(`${lamports} is not a quantity of Lamports`);
 * }
 * ```
 */
export function isLamports(putativeLamports: bigint): putativeLamports is Lamports {
    return putativeLamports >= 0 && putativeLamports <= maxU64Value;
}

/**
 * Lamport values returned from the RPC API conform to the type {@link Lamports}. You can use a
 * value of that type wherever a quantity of Lamports is expected.
 *
 * @example
 * From time to time you might acquire a number that you expect to be a quantity of Lamports, from
 * an untrusted network API or user input. To assert that such an arbitrary number is usable as a
 * quantity of Lamports, use this function.
 *
 * ```ts
 * import { assertIsLamports } from '@solana/rpc-types';
 *
 * // Imagine a function that creates a transfer instruction when a user submits a form.
 * function handleSubmit() {
 *     // We know only that what the user typed conforms to the `number` type.
 *     const lamports: number = parseInt(quantityInput.value, 10);
 *     try {
 *         // If this type assertion function doesn't throw, then
 *         // Typescript will upcast `lamports` to `Lamports`.
 *         assertIsLamports(lamports);
 *         // At this point, `lamports` is a `Lamports` that can be used anywhere Lamports are expected.
 *         await transfer(fromAddress, toAddress, lamports);
 *     } catch (e) {
 *         // `lamports` turned out not to validate as a quantity of Lamports.
 *     }
 * }
 * ```
 */
export function assertIsLamports(putativeLamports: bigint): asserts putativeLamports is Lamports {
    if (putativeLamports < 0 || putativeLamports > maxU64Value) {
        throw new SolanaError(SOLANA_ERROR__LAMPORTS_OUT_OF_RANGE);
    }
}

/**
 * This helper combines _asserting_ that a number is a possible number of {@link Lamports} with
 * _coercing_ it to the {@link Lamports} type. It's best used with untrusted input.
 *
 * @example
 * ```ts
 * import { lamports } from '@solana/rpc-types';
 *
 * await transfer(address(fromAddress), address(toAddress), lamports(100000n));
 * ```
 */
export function lamports(putativeLamports: bigint): Lamports {
    assertIsLamports(putativeLamports);
    return putativeLamports;
}

type ExtractAdditionalProps<T, U> = Omit<T, keyof U>;

/**
 * Returns an encoder that you can use to encode a 64-bit {@link Lamports} value to 8 bytes in
 * little endian order.
 */
export function getDefaultLamportsEncoder(): FixedSizeEncoder<Lamports, 8> {
    return getLamportsEncoder(getMemoizedU64Encoder());
}

/**
 * Returns an encoder that you can use to encode a {@link Lamports} value to a byte array.
 *
 * You must supply a number decoder that will determine how encode the numeric value.
 *
 * @example
 * ```ts
 * import { getLamportsEncoder } from '@solana/rpc-types';
 * import { getU16Encoder } from '@solana/codecs-numbers';
 *
 * const lamports = lamports(256n);
 * const lamportsEncoder = getLamportsEncoder(getU16Encoder());
 * const lamportsBytes = lamportsEncoder.encode(lamports);
 * // Uint8Array(2) [ 0, 1 ]
 * ```
 */
export function getLamportsEncoder<TEncoder extends NumberEncoder>(
    innerEncoder: TEncoder,
): Encoder<Lamports> & ExtractAdditionalProps<TEncoder, NumberEncoder> {
    return innerEncoder;
}

/**
 * Returns a decoder that you can use to decode a byte array representing a 64-bit little endian
 * number to a {@link Lamports} value.
 */
export function getDefaultLamportsDecoder(): FixedSizeDecoder<Lamports, 8> {
    return getLamportsDecoder(getMemoizedU64Decoder());
}

/**
 * Returns a decoder that you can use to convert an array of bytes representing a number to a
 * {@link Lamports} value.
 *
 * You must supply a number decoder that will determine how many bits to use to decode the numeric
 * value.
 *
 * @example
 * ```ts
 * import { getLamportsDecoder } from '@solana/rpc-types';
 * import { getU16Decoder } from '@solana/codecs-numbers';
 *
 * const lamportsBytes = new Uint8Array([ 0, 1 ]);
 * const lamportsDecoder = getLamportsDecoder(getU16Decoder());
 * const lamports = lamportsDecoder.decode(lamportsBytes); // lamports(256n)
 * ```
 */
export function getLamportsDecoder<TDecoder extends NumberDecoder>(
    innerDecoder: TDecoder,
): Decoder<Lamports> & ExtractAdditionalProps<TDecoder, NumberDecoder> {
    return transformDecoder<bigint | number, Lamports>(innerDecoder, value =>
        lamports(typeof value === 'bigint' ? value : BigInt(value)),
    ) as Decoder<Lamports> & ExtractAdditionalProps<TDecoder, NumberDecoder>;
}

/**
 * Returns a codec that you can use to encode from or decode to a 64-bit {@link Lamports} value.
 *
 * @see {@link getDefaultLamportsDecoder}
 * @see {@link getDefaultLamportsEncoder}
 */
export function getDefaultLamportsCodec(): FixedSizeCodec<Lamports, Lamports, 8> {
    return combineCodec(getDefaultLamportsEncoder(), getDefaultLamportsDecoder());
}

/**
 * Returns a codec that you can use to encode from or decode to {@link Lamports} value.
 *
 * @see {@link getLamportsDecoder}
 * @see {@link getLamportsEncoder}
 */
export function getLamportsCodec<TCodec extends NumberCodec>(
    innerCodec: TCodec,
): Codec<Lamports, Lamports> & ExtractAdditionalProps<TCodec, NumberCodec> {
    return combineCodec(getLamportsEncoder(innerCodec), getLamportsDecoder(innerCodec)) as Codec<Lamports, Lamports> &
        ExtractAdditionalProps<TCodec, NumberCodec>;
}
