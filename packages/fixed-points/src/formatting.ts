import { roundDivision, type RoundingMode } from './rounding';

/**
 * Options accepted by `binaryFixedPointToString` and
 * `decimalFixedPointToString` to control the emitted representation.
 *
 * - `decimals`: caps the number of fractional digits in the output. When
 *   this is lower than the value's native precision the raw value is
 *   rescaled using `rounding` (defaults to `'strict'`, which throws
 *   `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS` on inexact
 *   results). When higher, the extra precision is zero-padded only if
 *   `padTrailingZeros` is also set.
 * - `padTrailingZeros`: emits exactly as many fractional digits as
 *   requested by `decimals`. When `decimals` is omitted, pads to the
 *   value's native scale (`decimals` for decimal values,
 *   `fractionalBits` for binary values — the length of the exact
 *   base-10 expansion). Defaults to `false`, which trims trailing zeros
 *   (and drops the decimal point altogether for whole numbers).
 * - `rounding`: only consulted when `decimals` forces a scale-down.
 *   Defaults to `'strict'`.
 */
export type FixedPointToStringOptions = {
    decimals?: number;
    padTrailingZeros?: boolean;
    rounding?: RoundingMode;
};

/**
 * Rescales `raw` from `currentDecimals` decimal digits to `options.decimals`
 * decimal digits (when set), respecting `options.rounding`. Returns the
 * raw value to format and the number of fractional digits implied by it.
 *
 * @internal
 */
export function applyDecimalsOption(
    kind: 'binaryFixedPoint' | 'decimalFixedPoint',
    raw: bigint,
    currentDecimals: number,
    options: FixedPointToStringOptions | undefined,
): { decimals: number; raw: bigint } {
    const targetDecimals = options?.decimals;
    if (targetDecimals === undefined || targetDecimals === currentDecimals) {
        return { decimals: currentDecimals, raw };
    }
    if (targetDecimals > currentDecimals) {
        return {
            decimals: targetDecimals,
            raw: raw * 10n ** BigInt(targetDecimals - currentDecimals),
        };
    }
    const divisor = 10n ** BigInt(currentDecimals - targetDecimals);
    const rescaled = roundDivision(kind, 'toString', raw, divisor, options?.rounding ?? 'strict');
    return { decimals: targetDecimals, raw: rescaled };
}

/**
 * Formats a scaled bigint `(raw, decimals)` as a canonical decimal
 * string. When `padTrailingZeros` is `true`, the output emits exactly
 * `decimals` fractional digits; otherwise trailing zeros are trimmed and
 * the decimal point is dropped if the fractional part becomes empty.
 *
 * @internal
 */
export function formatScaledBigint(raw: bigint, decimals: number, padTrailingZeros: boolean): string {
    if (decimals === 0) {
        return raw.toString();
    }
    const isNegative = raw < 0n;
    const absDigits = (isNegative ? -raw : raw).toString();
    const padded = absDigits.padStart(decimals + 1, '0');
    const integerPart = padded.slice(0, -decimals);
    let fractionalPart = padded.slice(-decimals);
    if (!padTrailingZeros) {
        fractionalPart = fractionalPart.replace(/0+$/, '');
    }
    const sign = isNegative ? '-' : '';
    if (fractionalPart.length === 0) {
        return `${sign}${integerPart}`;
    }
    return `${sign}${integerPart}.${fractionalPart}`;
}
