import { SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, SolanaError } from '@solana/errors';

/**
 * Rounding mode used by fixed-point operations that must coerce an exact
 * mathematical result into a value with fewer bits of precision. Applies to
 * factories that accept lossy inputs, as well as to downscaling rescales and
 * divisions.
 *
 * - `'floor'` rounds toward negative infinity.
 * - `'ceil'` rounds toward positive infinity.
 * - `'trunc'` rounds toward zero, discarding the fractional part.
 * - `'round'` rounds to the nearest representable value, with ties rounded
 *   away from zero. That is, `0.5` rounds to `1`, `-0.5` rounds to `-1`, and
 *   `-1.5` rounds to `-2`. This is symmetric around zero and differs from
 *   JavaScript's `Math.round`, which breaks ties toward positive infinity.
 * - `'strict'` rejects any input that would require rounding and throws
 *   `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS` instead of
 *   coercing the result.
 */
export type RoundingMode = 'ceil' | 'floor' | 'round' | 'strict' | 'trunc';

/**
 * Divides `numerator` by `denominator` and rounds the quotient according to
 * the given {@link RoundingMode}.
 *
 * If the division is exact, the quotient is returned unchanged regardless
 * of the rounding mode. Otherwise, `'strict'` throws
 * `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS` and the other
 * modes round as documented on {@link RoundingMode}.
 *
 * The helper handles negative numerators and denominators correctly and
 * assumes `denominator !== 0n` — callers must check for and report
 * division-by-zero before invoking this function.
 *
 * @internal
 */
export function roundDivision(
    kind: 'binaryFixedPoint' | 'decimalFixedPoint',
    operation: string,
    numerator: bigint,
    denominator: bigint,
    mode: RoundingMode,
): bigint {
    const quotient = numerator / denominator;
    const remainder = numerator - quotient * denominator;
    if (remainder === 0n) {
        return quotient;
    }
    if (mode === 'strict') {
        throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS, {
            kind,
            operation,
        });
    }
    const sameSign = numerator < 0n === denominator < 0n;
    if (mode === 'trunc') {
        return quotient;
    }
    if (mode === 'floor') {
        return sameSign ? quotient : quotient - 1n;
    }
    if (mode === 'ceil') {
        return sameSign ? quotient + 1n : quotient;
    }
    // 'round': ties away from zero.
    const absRemainderDoubled = (remainder < 0n ? -remainder : remainder) * 2n;
    const absDenominator = denominator < 0n ? -denominator : denominator;
    if (absRemainderDoubled < absDenominator) {
        return quotient;
    }
    return sameSign ? quotient + 1n : quotient - 1n;
}
