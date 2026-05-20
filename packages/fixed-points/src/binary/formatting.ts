import { applyDecimalsOption, type FixedPointToStringOptions, formatScaledBigint } from '../formatting';
import type { Signedness } from '../signedness';
import { binaryFixedPointToBase10 } from './conversions';
import type { BinaryFixedPoint } from './core';

/**
 * Returns the canonical decimal string representation of a
 * {@link BinaryFixedPoint}.
 *
 * Because `1 / 2 ** fractionalBits` has a finite decimal expansion, the
 * default output is always exact. This means that values with many
 * `fractionalBits` can produce long strings — pass `options.decimals` to
 * cap the output at a desired precision, optionally with a
 * {@link RoundingMode}. Use `options.padTrailingZeros` to emit exactly as
 * many fractional digits as requested; when `decimals` is omitted, this
 * pads to `value.fractionalBits` (the full exact expansion length).
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS` when
 * `options.decimals` forces a lossy rescale under the default `'strict'`
 * rounding mode.
 *
 * @example
 * ```ts
 * const q1_15 = binaryFixedPoint('signed', 16, 15);
 * binaryFixedPointToString(q1_15('0.5'));                                 // "0.5"
 * binaryFixedPointToString(q1_15('0.5'), { padTrailingZeros: true });     // "0.500000000000000"
 * binaryFixedPointToString(ugly, { decimals: 2, rounding: 'round' });     // "0.48"
 * ```
 *
 * @see {@link binaryFixedPointToNumber}
 */
export function binaryFixedPointToString(
    value: BinaryFixedPoint<Signedness, number, number>,
    options?: FixedPointToStringOptions,
): string {
    const base10 = binaryFixedPointToBase10(value);
    const { decimals, raw } = applyDecimalsOption('binaryFixedPoint', base10.raw, base10.decimals, options);
    return formatScaledBigint(raw, decimals, options?.padTrailingZeros ?? false);
}

/**
 * Formats a {@link BinaryFixedPoint} using a user-supplied
 * `Intl.NumberFormat` instance, preserving full precision regardless of
 * the value's magnitude.
 *
 * Internally calls {@link binaryFixedPointToBase10} and forwards the
 * resulting integer to `formatter.format` using ES2023 string scientific
 * notation (`"<raw>E-<decimals>"`). This preserves precision in
 * fully-compliant runtimes and bypasses the JavaScript `number` mantissa
 * limit.
 *
 * Use this when you want locale-aware output, currency formatting,
 * grouping separators, or rounding modes from the rich
 * `Intl.NumberFormat` API. Prefer {@link binaryFixedPointToString} when
 * portability across older runtimes (older Hermes/React Native, etc.) is
 * a concern.
 *
 * @example
 * ```ts
 * const q1_15 = binaryFixedPoint('signed', 16, 15);
 * const formatter = new Intl.NumberFormat('fr-FR', {
 *     maximumFractionDigits: 4,
 * });
 * formatBinaryFixedPoint(formatter, q1_15('0.1')); // "0,1"
 * ```
 *
 * @see {@link binaryFixedPointToString}
 * @see {@link binaryFixedPointToBase10}
 */
export function formatBinaryFixedPoint(
    formatter: Intl.NumberFormat,
    value: BinaryFixedPoint<Signedness, number, number>,
): string {
    const { decimals, raw } = binaryFixedPointToBase10(value);
    return (formatter.format as unknown as (input: string) => string)(`${raw}E-${decimals}`);
}

/**
 * Converts a {@link BinaryFixedPoint} to a JavaScript `number`.
 *
 * Precision loss occurs only when `|value.raw / 2 ** fractionalBits|`
 * exceeds `Number.MAX_SAFE_INTEGER`, since JavaScript numbers have only
 * ~53 bits of mantissa. For values whose magnitude fits that budget the
 * result is exact, regardless of the raw value's magnitude.
 *
 * For exact representations prefer {@link binaryFixedPointToString}.
 *
 * @example
 * ```ts
 * const q1_15 = binaryFixedPoint('signed', 16, 15);
 * binaryFixedPointToNumber(q1_15('0.5')); // 0.5
 * ```
 *
 * @see {@link binaryFixedPointToString}
 */
export function binaryFixedPointToNumber(value: BinaryFixedPoint<Signedness, number, number>): number {
    const { fractionalBits, raw } = value;
    if (fractionalBits === 0) {
        return Number(raw);
    }
    // Split `raw` into an integer and a fractional residue before coercing to
    // Number. This preserves exactness for values whose final magnitude fits
    // ~53 bits of mantissa even when `|raw|` itself exceeds MAX_SAFE_INTEGER.
    const scale = 1n << BigInt(fractionalBits);
    const integerPart = raw / scale;
    const fractionalPart = Number(raw - integerPart * scale) / 2 ** fractionalBits;
    return Number(integerPart) + fractionalPart;
}
