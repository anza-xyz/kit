import {
    combineCodec,
    type FixedSizeCodec,
    type FixedSizeDecoder,
    type FixedSizeEncoder,
    transformDecoder,
    transformEncoder,
} from '@solana/codecs-core';
import { getU64Decoder, getU64Encoder } from '@solana/codecs-numbers';
import {
    type DecimalFixedPoint,
    decimalFixedPoint,
    rawDecimalFixedPoint,
    type RoundingMode,
} from '@solana/fixed-points';

import { type Lamports, lamports } from './lamports';

/**
 * The canonical fixed-point shape for SOL amounts: unsigned 64-bit with 9
 * decimals. Since 1 SOL equals `10 ** 9` Lamports, a `Sol` value's `raw`
 * bigint is exactly the corresponding Lamports count.
 */
export type Sol = DecimalFixedPoint<'unsigned', 64, 9>;

let memoizedSolFactory: ReturnType<typeof decimalFixedPoint<'unsigned', 64, 9>> | undefined;
let memoizedRawSolFactory: ReturnType<typeof rawDecimalFixedPoint<'unsigned', 64, 9>> | undefined;

function solFactory(value: string, rounding?: RoundingMode): Sol {
    if (!memoizedSolFactory) memoizedSolFactory = decimalFixedPoint('unsigned', 64, 9);
    return memoizedSolFactory(value, rounding);
}

function rawSolFactory(value: bigint): Sol {
    if (!memoizedRawSolFactory) memoizedRawSolFactory = rawDecimalFixedPoint('unsigned', 64, 9);
    return memoizedRawSolFactory(value);
}

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
 * Parses a decimal string as a {@link Sol} fixed-point value.
 *
 * The default rounding mode is `'strict'`, which throws
 * `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS` when the input
 * has more than 9 fractional digits. Pass another `RoundingMode` to accept
 * a rounded result.
 *
 * @example
 * ```ts
 * sol('1.5');            // represents 1.5 SOL (raw === 1_500_000_000n)
 * sol('0.000000001');    // the smallest representable amount: 1 Lamport
 * sol('1.1234567891', 'round'); // rounded to 9 decimals
 * ```
 *
 * @see {@link solToLamports}
 * @see {@link lamportsToSol}
 */
export function sol(value: string, rounding?: RoundingMode): Sol {
    return solFactory(value, rounding);
}

/**
 * Converts a {@link Sol} fixed-point value to its equivalent {@link Lamports}
 * bigint. This conversion is exact — a `Sol` value's raw bigint is exactly
 * the Lamports count.
 *
 * @example
 * ```ts
 * solToLamports(sol('1.5')); // lamports(1_500_000_000n)
 * ```
 *
 * @see {@link lamportsToSol}
 * @see {@link sol}
 */
export function solToLamports(value: Sol): Lamports {
    return lamports(value.raw);
}

/**
 * Converts a {@link Lamports} bigint to its equivalent {@link Sol}
 * fixed-point value. This conversion is exact.
 *
 * @example
 * ```ts
 * lamportsToSol(lamports(1_500_000_000n)); // represents 1.5 SOL
 * ```
 *
 * @see {@link solToLamports}
 * @see {@link sol}
 */
export function lamportsToSol(value: Lamports): Sol {
    return rawSolFactory(value);
}

/**
 * Returns an encoder that writes a {@link Sol} or {@link Lamports} value to
 * 8 bytes in little-endian order. Since Sol and Lamports share the same
 * u64 wire format, either can be passed as input.
 *
 * @see {@link getSolDecoder}
 * @see {@link getSolCodec}
 */
export function getSolEncoder(): FixedSizeEncoder<Lamports | Sol, 8> {
    return transformEncoder<bigint | number, Lamports | Sol, 8>(getMemoizedU64Encoder(), value =>
        typeof value === 'bigint' ? value : value.raw,
    );
}

/**
 * Returns a decoder that reads 8 bytes in little-endian order into a
 * {@link Sol} value.
 *
 * @see {@link getSolEncoder}
 * @see {@link getSolCodec}
 */
export function getSolDecoder(): FixedSizeDecoder<Sol, 8> {
    return transformDecoder<bigint, Sol, 8>(getMemoizedU64Decoder(), value => rawSolFactory(value));
}

/**
 * Returns a codec combining {@link getSolEncoder} and {@link getSolDecoder}.
 * The encoder accepts either {@link Sol} or {@link Lamports}; the decoder
 * always returns {@link Sol}.
 *
 * @see {@link getSolEncoder}
 * @see {@link getSolDecoder}
 */
export function getSolCodec(): FixedSizeCodec<Lamports | Sol, Sol, 8> {
    return combineCodec(getSolEncoder(), getSolDecoder());
}
