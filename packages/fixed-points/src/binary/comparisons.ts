import { assertShapeMatches, describeShape } from '../assertions';
import type { Signedness } from '../signedness';
import type { BinaryFixedPoint } from './core';

/**
 * Compares two {@link BinaryFixedPoint} values and returns `-1`, `0`, or
 * `1` depending on whether `a` is less than, equal to, or greater than `b`.
 *
 * Only the `kind` and `fractionalBits` of the two operands must match;
 * `signedness` and `totalBits` are allowed to differ because they are
 * storage concerns only and do not affect the mathematical value being
 * compared. Mismatches on the constrained dimensions throw
 * `SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH`.
 *
 * @example
 * ```ts
 * const q1_15 = binaryFixedPoint('signed', 16, 15);
 * cmpBinaryFixedPoint(q1_15('0.25'), q1_15('0.5')); // -1
 * cmpBinaryFixedPoint(q1_15('0.5'), q1_15('0.5'));  // 0
 * cmpBinaryFixedPoint(q1_15('0.75'), q1_15('0.5')); // 1
 * ```
 *
 * @see {@link eqBinaryFixedPoint}
 * @see {@link ltBinaryFixedPoint}
 * @see {@link lteBinaryFixedPoint}
 * @see {@link gtBinaryFixedPoint}
 * @see {@link gteBinaryFixedPoint}
 */
export function cmpBinaryFixedPoint<TFractionalBits extends number>(
    a: BinaryFixedPoint<Signedness, number, TFractionalBits>,
    b: BinaryFixedPoint<Signedness, number, NoInfer<TFractionalBits>>,
): -1 | 0 | 1 {
    assertShapeMatches('cmpBinaryFixedPoint', describeShape(b), {
        kind: a.kind,
        scale: a.fractionalBits,
        scaleLabel: 'fractional bits',
    });
    return a.raw < b.raw ? -1 : a.raw > b.raw ? 1 : 0;
}

/**
 * Returns `true` when `a` and `b` represent the same value.
 *
 * See {@link cmpBinaryFixedPoint} for shape-matching rules.
 */
export function eqBinaryFixedPoint<TFractionalBits extends number>(
    a: BinaryFixedPoint<Signedness, number, TFractionalBits>,
    b: BinaryFixedPoint<Signedness, number, NoInfer<TFractionalBits>>,
): boolean {
    return cmpBinaryFixedPoint(a, b) === 0;
}

/**
 * Returns `true` when `a` is strictly less than `b`.
 *
 * See {@link cmpBinaryFixedPoint} for shape-matching rules.
 */
export function ltBinaryFixedPoint<TFractionalBits extends number>(
    a: BinaryFixedPoint<Signedness, number, TFractionalBits>,
    b: BinaryFixedPoint<Signedness, number, NoInfer<TFractionalBits>>,
): boolean {
    return cmpBinaryFixedPoint(a, b) < 0;
}

/**
 * Returns `true` when `a` is less than or equal to `b`.
 *
 * See {@link cmpBinaryFixedPoint} for shape-matching rules.
 */
export function lteBinaryFixedPoint<TFractionalBits extends number>(
    a: BinaryFixedPoint<Signedness, number, TFractionalBits>,
    b: BinaryFixedPoint<Signedness, number, NoInfer<TFractionalBits>>,
): boolean {
    return cmpBinaryFixedPoint(a, b) <= 0;
}

/**
 * Returns `true` when `a` is strictly greater than `b`.
 *
 * See {@link cmpBinaryFixedPoint} for shape-matching rules.
 */
export function gtBinaryFixedPoint<TFractionalBits extends number>(
    a: BinaryFixedPoint<Signedness, number, TFractionalBits>,
    b: BinaryFixedPoint<Signedness, number, NoInfer<TFractionalBits>>,
): boolean {
    return cmpBinaryFixedPoint(a, b) > 0;
}

/**
 * Returns `true` when `a` is greater than or equal to `b`.
 *
 * See {@link cmpBinaryFixedPoint} for shape-matching rules.
 */
export function gteBinaryFixedPoint<TFractionalBits extends number>(
    a: BinaryFixedPoint<Signedness, number, TFractionalBits>,
    b: BinaryFixedPoint<Signedness, number, NoInfer<TFractionalBits>>,
): boolean {
    return cmpBinaryFixedPoint(a, b) >= 0;
}
