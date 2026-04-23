import {
    assertFractionalBitsFitInTotalBits,
    assertRawFitsInRange,
    assertRawIsBigint,
    assertShapeMatches,
    describeShape,
} from '../assertions';
import type { Signedness } from '../signedness';
import type { BinaryFixedPoint } from './core';

/**
 * Asserts that `value` is a {@link BinaryFixedPoint}.
 *
 * Every shape parameter is independently optional. Pass `undefined` (or
 * simply omit trailing arguments) to leave a given field unconstrained.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH` if the value does
 * not match the expected shape, or
 * `SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE` if the `raw` bigint
 * does not fit the claimed signedness and total bits.
 *
 * @example
 * ```ts
 * assertIsBinaryFixedPoint(value);                   // any binary fixed-point
 * assertIsBinaryFixedPoint(value, 'signed');         // any signed binary
 * assertIsBinaryFixedPoint(value, 'signed', 16, 15); // fully pinned
 * assertIsBinaryFixedPoint(value, undefined, 16);    // any binary with totalBits=16
 * ```
 *
 * @see {@link isBinaryFixedPoint}
 * @see {@link BinaryFixedPoint}
 */
export function assertIsBinaryFixedPoint<
    TSignedness extends Signedness = Signedness,
    TTotalBits extends number = number,
    TFractionalBits extends number = number,
>(
    value: unknown,
    signedness?: TSignedness,
    totalBits?: TTotalBits,
    fractionalBits?: TFractionalBits,
): asserts value is BinaryFixedPoint<TSignedness, TTotalBits, TFractionalBits> {
    const actual = describeShape(value);
    const expected = {
        kind: 'binaryFixedPoint',
        scale: fractionalBits,
        scaleLabel: 'fractional bits',
        signedness,
        totalBits,
    };
    assertShapeMatches('assertIsBinaryFixedPoint', actual, expected);
    // Binary fixed-points carry an extra structural invariant beyond the
    // generic shape check: `fractionalBits` (stored in `actual.scale`)
    // must not exceed `totalBits`.
    assertFractionalBitsFitInTotalBits(actual.scale, actual.totalBits);
    assertRawIsBigint('binaryFixedPoint', value);
    assertRawFitsInRange('binaryFixedPoint', actual.signedness as Signedness, actual.totalBits, value.raw);
}

/**
 * Type guard that refines an unknown value to a {@link BinaryFixedPoint}.
 *
 * Accepts the same partial-positional shape arguments as
 * {@link assertIsBinaryFixedPoint} and returns `true` if the assertion
 * would pass, `false` otherwise.
 *
 * @example
 * ```ts
 * if (isBinaryFixedPoint(value)) {
 *     value satisfies BinaryFixedPoint<Signedness, number, number>;
 * }
 * if (isBinaryFixedPoint(value, 'signed', 16, 15)) {
 *     value satisfies BinaryFixedPoint<'signed', 16, 15>;
 * }
 * ```
 *
 * @see {@link assertIsBinaryFixedPoint}
 * @see {@link BinaryFixedPoint}
 */
export function isBinaryFixedPoint<
    TSignedness extends Signedness = Signedness,
    TTotalBits extends number = number,
    TFractionalBits extends number = number,
>(
    value: unknown,
    signedness?: TSignedness,
    totalBits?: TTotalBits,
    fractionalBits?: TFractionalBits,
): value is BinaryFixedPoint<TSignedness, TTotalBits, TFractionalBits> {
    try {
        assertIsBinaryFixedPoint(value, signedness, totalBits, fractionalBits);
        return true;
    } catch {
        return false;
    }
}
