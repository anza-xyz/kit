import { assertRawFitsInRange } from '../assertions';
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
