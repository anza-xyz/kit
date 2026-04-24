import {
    assertNoArithmeticOverflow,
    assertRawFitsInRange,
    assertValidDecimals,
    assertValidTotalBits,
} from '../assertions';
import { roundDivision, type RoundingMode } from '../rounding';
import type { Signedness } from '../signedness';
import type { DecimalFixedPoint } from './core';

/**
 * Converts a {@link DecimalFixedPoint} to its unsigned equivalent at the
 * same `totalBits` and `decimals`.
 *
 * Unsigned inputs are returned by reference unchanged; signed inputs are
 * accepted as long as their raw value is non-negative.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE` when the input
 * represents a negative value that cannot be stored as unsigned.
 *
 * @example
 * ```ts
 * const signedUsd = decimalFixedPoint('signed', 64, 2);
 * toUnsignedDecimalFixedPoint(signedUsd('1.50')); // unsigned, raw unchanged
 * toUnsignedDecimalFixedPoint(signedUsd('-1'));   // throws
 * ```
 *
 * @see {@link toSignedDecimalFixedPoint}
 */
export function toUnsignedDecimalFixedPoint<TTotalBits extends number, TDecimals extends number>(
    value: DecimalFixedPoint<Signedness, TTotalBits, TDecimals>,
): DecimalFixedPoint<'unsigned', TTotalBits, TDecimals> {
    if (value.signedness === 'unsigned') {
        return value as DecimalFixedPoint<'unsigned', TTotalBits, TDecimals>;
    }
    assertRawFitsInRange('decimalFixedPoint', 'unsigned', value.totalBits, value.raw);
    return Object.freeze({ ...value, signedness: 'unsigned' });
}

/**
 * Converts a {@link DecimalFixedPoint} to its signed equivalent at the same
 * `totalBits` and `decimals`.
 *
 * Signed inputs are returned by reference unchanged; unsigned inputs are
 * accepted as long as their raw value fits the signed range, i.e.
 * `raw <= 2 ** (totalBits - 1) - 1`.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__VALUE_OUT_OF_RANGE` when the input's
 * raw value exceeds the maximum representable signed value at its
 * `totalBits`.
 *
 * @example
 * ```ts
 * const unsigned = rawDecimalFixedPoint('unsigned', 8, 0);
 * toSignedDecimalFixedPoint(unsigned(100n)); // signed, raw === 100n
 * toSignedDecimalFixedPoint(unsigned(200n)); // throws (200 > 127)
 * ```
 *
 * @see {@link toUnsignedDecimalFixedPoint}
 */
export function toSignedDecimalFixedPoint<TTotalBits extends number, TDecimals extends number>(
    value: DecimalFixedPoint<Signedness, TTotalBits, TDecimals>,
): DecimalFixedPoint<'signed', TTotalBits, TDecimals> {
    if (value.signedness === 'signed') {
        return value as DecimalFixedPoint<'signed', TTotalBits, TDecimals>;
    }
    assertRawFitsInRange('decimalFixedPoint', 'signed', value.totalBits, value.raw);
    return Object.freeze({ ...value, signedness: 'signed' });
}

/**
 * Returns a {@link DecimalFixedPoint} with the same signedness as `value`
 * but a new `totalBits` and `decimals`. If the requested shape matches
 * the input shape, the same reference is returned.
 *
 * Scale-up (higher `decimals`) is always exact. Scale-down (lower
 * `decimals`) is potentially lossy; the optional {@link RoundingMode} is
 * consulted on inexact results and defaults to `'strict'`, which throws
 * `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS`.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__ARITHMETIC_OVERFLOW` when the
 * rescaled raw value does not fit the new `totalBits`.
 *
 * @example
 * ```ts
 * // Bridge EVM USDC (u128 d18) down to SPL USDC (u64 d6).
 * const evmUsdc = decimalFixedPoint('unsigned', 128, 18);
 * rescaleDecimalFixedPoint(evmUsdc('100.123456789012345678'), 64, 6, 'floor');
 * // represents 100.123456
 * ```
 *
 * @see {@link toSignedDecimalFixedPoint}
 * @see {@link toUnsignedDecimalFixedPoint}
 */
export function rescaleDecimalFixedPoint<
    TSignedness extends Signedness,
    TNewTotalBits extends number,
    TNewDecimals extends number,
>(
    value: DecimalFixedPoint<TSignedness, number, number>,
    newTotalBits: TNewTotalBits,
    newDecimals: TNewDecimals,
    rounding: RoundingMode = 'strict',
): DecimalFixedPoint<TSignedness, TNewTotalBits, TNewDecimals> {
    assertValidTotalBits('decimalFixedPoint', newTotalBits);
    assertValidDecimals(newDecimals);
    if (value.totalBits === newTotalBits && value.decimals === newDecimals) {
        return value as DecimalFixedPoint<TSignedness, TNewTotalBits, TNewDecimals>;
    }
    let result: bigint;
    if (newDecimals === value.decimals) {
        result = value.raw;
    } else if (newDecimals > value.decimals) {
        result = value.raw * 10n ** BigInt(newDecimals - value.decimals);
    } else {
        result = roundDivision(
            'decimalFixedPoint',
            'rescale',
            value.raw,
            10n ** BigInt(value.decimals - newDecimals),
            rounding,
        );
    }
    assertNoArithmeticOverflow('decimalFixedPoint', 'rescale', value.signedness, newTotalBits, result);
    return Object.freeze({ ...value, decimals: newDecimals, raw: result, totalBits: newTotalBits });
}
