import { assertShapeMatches, describeShape } from '../assertions';
import type { Signedness } from '../signedness';
import type { DecimalFixedPoint } from './core';

/**
 * Compares two {@link DecimalFixedPoint} values and returns `-1`, `0`, or
 * `1` depending on whether `a` is less than, equal to, or greater than `b`.
 *
 * Only the `kind` and `decimals` of the two operands must match;
 * `signedness` and `totalBits` are allowed to differ because they are
 * storage concerns only and do not affect the mathematical value being
 * compared. Mismatches on the constrained dimensions throw
 * `SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH`.
 *
 * @example
 * ```ts
 * const usd = decimalFixedPoint('unsigned', 64, 2);
 * cmpDecimalFixedPoint(usd('1.25'), usd('2.50')); // -1
 * cmpDecimalFixedPoint(usd('2.50'), usd('2.50')); // 0
 * cmpDecimalFixedPoint(usd('3.75'), usd('2.50')); // 1
 * ```
 *
 * @see {@link eqDecimalFixedPoint}
 * @see {@link ltDecimalFixedPoint}
 * @see {@link lteDecimalFixedPoint}
 * @see {@link gtDecimalFixedPoint}
 * @see {@link gteDecimalFixedPoint}
 */
export function cmpDecimalFixedPoint<TDecimals extends number>(
    a: DecimalFixedPoint<Signedness, number, TDecimals>,
    b: DecimalFixedPoint<Signedness, number, NoInfer<TDecimals>>,
): -1 | 0 | 1 {
    assertShapeMatches('cmpDecimalFixedPoint', describeShape(b), {
        kind: a.kind,
        scale: a.decimals,
        scaleLabel: 'decimals',
    });
    return a.raw < b.raw ? -1 : a.raw > b.raw ? 1 : 0;
}

/**
 * Returns `true` when `a` and `b` represent the same value.
 *
 * See {@link cmpDecimalFixedPoint} for shape-matching rules.
 */
export function eqDecimalFixedPoint<TDecimals extends number>(
    a: DecimalFixedPoint<Signedness, number, TDecimals>,
    b: DecimalFixedPoint<Signedness, number, NoInfer<TDecimals>>,
): boolean {
    return cmpDecimalFixedPoint(a, b) === 0;
}

/**
 * Returns `true` when `a` is strictly less than `b`.
 *
 * See {@link cmpDecimalFixedPoint} for shape-matching rules.
 */
export function ltDecimalFixedPoint<TDecimals extends number>(
    a: DecimalFixedPoint<Signedness, number, TDecimals>,
    b: DecimalFixedPoint<Signedness, number, NoInfer<TDecimals>>,
): boolean {
    return cmpDecimalFixedPoint(a, b) < 0;
}

/**
 * Returns `true` when `a` is less than or equal to `b`.
 *
 * See {@link cmpDecimalFixedPoint} for shape-matching rules.
 */
export function lteDecimalFixedPoint<TDecimals extends number>(
    a: DecimalFixedPoint<Signedness, number, TDecimals>,
    b: DecimalFixedPoint<Signedness, number, NoInfer<TDecimals>>,
): boolean {
    return cmpDecimalFixedPoint(a, b) <= 0;
}

/**
 * Returns `true` when `a` is strictly greater than `b`.
 *
 * See {@link cmpDecimalFixedPoint} for shape-matching rules.
 */
export function gtDecimalFixedPoint<TDecimals extends number>(
    a: DecimalFixedPoint<Signedness, number, TDecimals>,
    b: DecimalFixedPoint<Signedness, number, NoInfer<TDecimals>>,
): boolean {
    return cmpDecimalFixedPoint(a, b) > 0;
}

/**
 * Returns `true` when `a` is greater than or equal to `b`.
 *
 * See {@link cmpDecimalFixedPoint} for shape-matching rules.
 */
export function gteDecimalFixedPoint<TDecimals extends number>(
    a: DecimalFixedPoint<Signedness, number, TDecimals>,
    b: DecimalFixedPoint<Signedness, number, NoInfer<TDecimals>>,
): boolean {
    return cmpDecimalFixedPoint(a, b) >= 0;
}
