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
