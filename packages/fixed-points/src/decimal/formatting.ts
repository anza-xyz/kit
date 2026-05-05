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
 * Formats a {@link DecimalFixedPoint} using a user-supplied
 * `Intl.NumberFormat` instance, preserving full precision regardless of
 * the value's magnitude.
 *
 * Forwards `value.raw` to `formatter.format` using ES2023 string
 * scientific notation (`"<raw>E-<decimals>"`). This preserves precision
 * in fully-compliant runtimes and bypasses the JavaScript `number`
 * mantissa limit.
 *
 * Use this when you want locale-aware output, currency formatting,
 * grouping separators, or rounding modes from the rich
 * `Intl.NumberFormat` API. Prefer {@link decimalFixedPointToString} when
 * portability across older runtimes (older Hermes/React Native, etc.) is
 * a concern.
 *
 * @example
 * ```ts
 * const usdc = decimalFixedPoint('unsigned', 64, 6);
 * const formatter = new Intl.NumberFormat('en-US', {
 *     currency: 'USD',
 *     style: 'currency',
 * });
 * formatDecimalFixedPoint(formatter, usdc('1234.5')); // "$1,234.50"
 * ```
 *
 * @see {@link decimalFixedPointToString}
 */
export function formatDecimalFixedPoint(
    formatter: Intl.NumberFormat,
    value: DecimalFixedPoint<Signedness, number, number>,
): string {
    return (formatter.format as unknown as (input: string) => string)(`${value.raw}E-${value.decimals}`);
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
