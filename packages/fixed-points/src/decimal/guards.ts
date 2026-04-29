import { assertRawFitsInRange, assertRawIsBigint, assertShapeMatches, describeShape } from '../assertions';
import type { Signedness } from '../signedness';
import type { DecimalFixedPoint } from './core';

/**
 * Asserts that `value` is a {@link DecimalFixedPoint}.
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
 * assertIsDecimalFixedPoint(value);                   // any decimal fixed-point
 * assertIsDecimalFixedPoint(value, 'unsigned');        // any unsigned decimal
 * assertIsDecimalFixedPoint(value, 'unsigned', 64, 6); // fully pinned
 * assertIsDecimalFixedPoint(value, undefined, 64);     // any decimal with totalBits=64
 * ```
 *
 * @see {@link isDecimalFixedPoint}
 * @see {@link DecimalFixedPoint}
 */
export function assertIsDecimalFixedPoint<
    TSignedness extends Signedness = Signedness,
    TTotalBits extends number = number,
    TDecimals extends number = number,
>(
    value: unknown,
    signedness?: TSignedness,
    totalBits?: TTotalBits,
    decimals?: TDecimals,
): asserts value is DecimalFixedPoint<TSignedness, TTotalBits, TDecimals> {
    const actual = describeShape(value);
    const expected = {
        kind: 'decimalFixedPoint',
        scale: decimals,
        scaleLabel: 'decimals',
        signedness,
        totalBits,
    };
    assertShapeMatches('assertIsDecimalFixedPoint', actual, expected);
    assertRawIsBigint('decimalFixedPoint', value);
    assertRawFitsInRange('decimalFixedPoint', actual.signedness as Signedness, actual.totalBits, value.raw);
}

/**
 * Type guard that refines an unknown value to a {@link DecimalFixedPoint}.
 *
 * Accepts the same partial-positional shape arguments as
 * {@link assertIsDecimalFixedPoint} and returns `true` if the assertion
 * would pass, `false` otherwise.
 *
 * @example
 * ```ts
 * if (isDecimalFixedPoint(value)) {
 *     value satisfies DecimalFixedPoint<Signedness, number, number>;
 * }
 * if (isDecimalFixedPoint(value, 'unsigned', 64, 6)) {
 *     value satisfies DecimalFixedPoint<'unsigned', 64, 6>;
 * }
 * ```
 *
 * @see {@link assertIsDecimalFixedPoint}
 * @see {@link DecimalFixedPoint}
 */
export function isDecimalFixedPoint<
    TSignedness extends Signedness = Signedness,
    TTotalBits extends number = number,
    TDecimals extends number = number,
>(
    value: unknown,
    signedness?: TSignedness,
    totalBits?: TTotalBits,
    decimals?: TDecimals,
): value is DecimalFixedPoint<TSignedness, TTotalBits, TDecimals> {
    try {
        assertIsDecimalFixedPoint(value, signedness, totalBits, decimals);
        return true;
    } catch {
        return false;
    }
}
