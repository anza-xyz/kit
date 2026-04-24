import {
    assertFractionalBitsFitInTotalBits,
    assertNoArithmeticOverflow,
    assertRawFitsInRange,
    assertValidFractionalBits,
    assertValidTotalBits,
} from '../assertions';
import { roundDivision, type RoundingMode } from '../rounding';
import type { Signedness } from '../signedness';
import type { BinaryFixedPoint } from './core';

/**
 * Converts a {@link BinaryFixedPoint} to its unsigned equivalent at the
 * same `totalBits` and `fractionalBits`.
 *
 * Unsigned inputs are returned by reference unchanged; signed inputs are
 * accepted as long as their raw value is non-negative.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE` when the input
 * represents a negative value that cannot be stored as unsigned.
 *
 * @example
 * ```ts
 * const signedUsd = binaryFixedPoint('signed', 16, 8);
 * toUnsignedBinaryFixedPoint(signedUsd('1.5')); // unsigned, raw unchanged
 * toUnsignedBinaryFixedPoint(signedUsd('-1'));  // throws
 * ```
 *
 * @see {@link toSignedBinaryFixedPoint}
 */
export function toUnsignedBinaryFixedPoint<TTotalBits extends number, TFractionalBits extends number>(
    value: BinaryFixedPoint<Signedness, TTotalBits, TFractionalBits>,
): BinaryFixedPoint<'unsigned', TTotalBits, TFractionalBits> {
    if (value.signedness === 'unsigned') {
        return value as BinaryFixedPoint<'unsigned', TTotalBits, TFractionalBits>;
    }
    assertRawFitsInRange('binaryFixedPoint', 'unsigned', value.totalBits, value.raw);
    return Object.freeze({ ...value, signedness: 'unsigned' });
}

/**
 * Converts a {@link BinaryFixedPoint} to its signed equivalent at the same
 * `totalBits` and `fractionalBits`.
 *
 * Signed inputs are returned by reference unchanged; unsigned inputs are
 * accepted as long as their raw value fits the signed range, i.e.
 * `raw <= 2 ** (totalBits - 1) - 1`.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE` when the input's
 * raw value exceeds the maximum representable signed value at its
 * `totalBits`.
 *
 * @example
 * ```ts
 * const unsigned = rawBinaryFixedPoint('unsigned', 8, 0);
 * toSignedBinaryFixedPoint(unsigned(100n)); // signed, raw === 100n
 * toSignedBinaryFixedPoint(unsigned(200n)); // throws (200 > 127)
 * ```
 *
 * @see {@link toUnsignedBinaryFixedPoint}
 */
export function toSignedBinaryFixedPoint<TTotalBits extends number, TFractionalBits extends number>(
    value: BinaryFixedPoint<Signedness, TTotalBits, TFractionalBits>,
): BinaryFixedPoint<'signed', TTotalBits, TFractionalBits> {
    if (value.signedness === 'signed') {
        return value as BinaryFixedPoint<'signed', TTotalBits, TFractionalBits>;
    }
    assertRawFitsInRange('binaryFixedPoint', 'signed', value.totalBits, value.raw);
    return Object.freeze({ ...value, signedness: 'signed' });
}

/**
 * Returns a {@link BinaryFixedPoint} with the same signedness as `value`
 * but a new `totalBits` and `fractionalBits`. If the requested shape
 * matches the input shape, the same reference is returned.
 *
 * Scale-up (higher `fractionalBits`) is always exact. Scale-down (lower
 * `fractionalBits`) is potentially lossy; the optional {@link RoundingMode}
 * is consulted on inexact results and defaults to `'strict'`, which throws
 * `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS`.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW` when the
 * rescaled raw value does not fit the new `totalBits`.
 *
 * @example
 * ```ts
 * const q1_15 = binaryFixedPoint('signed', 16, 15);
 * rescaleBinaryFixedPoint(q1_15('0.5'), 32, 30);          // wider, higher precision
 * rescaleBinaryFixedPoint(q1_15('0.5'), 16, 8, 'floor');  // lower precision, explicit rounding
 * ```
 *
 * @see {@link toSignedBinaryFixedPoint}
 * @see {@link toUnsignedBinaryFixedPoint}
 */
export function rescaleBinaryFixedPoint<
    TSignedness extends Signedness,
    TNewTotalBits extends number,
    TNewFractionalBits extends number,
>(
    value: BinaryFixedPoint<TSignedness, number, number>,
    newTotalBits: TNewTotalBits,
    newFractionalBits: TNewFractionalBits,
    rounding: RoundingMode = 'strict',
): BinaryFixedPoint<TSignedness, TNewTotalBits, TNewFractionalBits> {
    assertValidTotalBits('binaryFixedPoint', newTotalBits);
    assertValidFractionalBits(newFractionalBits);
    assertFractionalBitsFitInTotalBits(newFractionalBits, newTotalBits);
    if (value.totalBits === newTotalBits && value.fractionalBits === newFractionalBits) {
        return value as BinaryFixedPoint<TSignedness, TNewTotalBits, TNewFractionalBits>;
    }
    let result: bigint;
    if (newFractionalBits === value.fractionalBits) {
        result = value.raw;
    } else if (newFractionalBits > value.fractionalBits) {
        result = value.raw << BigInt(newFractionalBits - value.fractionalBits);
    } else {
        result = roundDivision(
            'binaryFixedPoint',
            'rescale',
            value.raw,
            1n << BigInt(value.fractionalBits - newFractionalBits),
            rounding,
        );
    }
    assertNoArithmeticOverflow('binaryFixedPoint', 'rescale', value.signedness, newTotalBits, result);
    return Object.freeze({ ...value, fractionalBits: newFractionalBits, raw: result, totalBits: newTotalBits });
}
