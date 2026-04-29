import { applyDecimalsOption, type FixedPointToStringOptions, formatScaledBigint } from '../formatting';
import type { Signedness } from '../signedness';
import type { DecimalFixedPoint } from './core';

/**
 * Returns the canonical decimal string representation of a
 * {@link DecimalFixedPoint}.
 *
 * By default, trailing zeros are trimmed and the decimal point is
 * dropped for whole numbers. Pass `options.decimals` to emit a different
 * number of fractional digits (with {@link RoundingMode} control when
 * scale-down is lossy), and `options.padTrailingZeros` to emit exactly
 * that many digits. When `padTrailingZeros` is set without `decimals`,
 * the output is padded to `value.decimals`.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS` when
 * `options.decimals` forces a lossy rescale under the default `'strict'`
 * rounding mode.
 *
 * @example
 * ```ts
 * const usdc = decimalFixedPoint('unsigned', 64, 6);
 * decimalFixedPointToString(usdc('42.5'));                               // "42.5"
 * decimalFixedPointToString(usdc('42.5'), { padTrailingZeros: true });   // "42.500000"
 * decimalFixedPointToString(usdc('42.678'), { decimals: 2, rounding: 'floor' }); // "42.67"
 * ```
 *
 * @see {@link decimalFixedPointToNumber}
 */
export function decimalFixedPointToString(
    value: DecimalFixedPoint<Signedness, number, number>,
    options?: FixedPointToStringOptions,
): string {
    const { decimals, raw } = applyDecimalsOption('decimalFixedPoint', value.raw, value.decimals, options);
    return formatScaledBigint(raw, decimals, options?.padTrailingZeros ?? false);
}

/**
 * Converts a {@link DecimalFixedPoint} to a JavaScript `number`.
 *
 * This conversion is inherently lossy: `1 / 10 ** decimals` is not
 * representable exactly in IEEE 754 for any positive `decimals`, and
 * additional precision is lost when `|value.raw|` exceeds
 * `Number.MAX_SAFE_INTEGER`, since JavaScript numbers have only ~53
 * bits of mantissa.
 *
 * For exact representations prefer {@link decimalFixedPointToString}.
 *
 * @example
 * ```ts
 * const usdc = decimalFixedPoint('unsigned', 64, 6);
 * decimalFixedPointToNumber(usdc('42.5')); // 42.5
 * ```
 *
 * @see {@link decimalFixedPointToString}
 */
export function decimalFixedPointToNumber(value: DecimalFixedPoint<Signedness, number, number>): number {
    return Number(value.raw) / 10 ** value.decimals;
}
