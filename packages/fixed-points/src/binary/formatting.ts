import { applyDecimalsOption, type FixedPointToStringOptions, formatScaledBigint } from '../formatting';
import type { Signedness } from '../signedness';
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
    // Convert the base-2 representation to an exact base-10 representation:
    // raw / 2 ** F === (raw * 5 ** F) / 10 ** F, which terminates cleanly.
    // The transformed raw carries exactly F decimal digits of precision.
    const base10Decimals = value.fractionalBits;
    const base10Raw = base10Decimals === 0 ? value.raw : value.raw * 5n ** BigInt(base10Decimals);
    const { decimals, raw } = applyDecimalsOption('binaryFixedPoint', base10Raw, base10Decimals, options);
    return formatScaledBigint(raw, decimals, options?.padTrailingZeros ?? false);
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
