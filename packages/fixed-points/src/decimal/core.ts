import { SOLANA_ERROR__FIXED_POINTS__INVALID_ZERO_DENOMINATOR_RATIO, SolanaError } from '@solana/errors';

import { assertRawFitsInRange, assertValidDecimals, assertValidTotalBits } from '../assertions';
import { parseDecimalString } from '../parsing';
import { roundDivision, type RoundingMode } from '../rounding';
import type { Signedness } from '../signedness';

/**
 * A fixed-point number whose scale is a power of 10. The stored `raw` bigint
 * represents the mathematical value `raw / 10 ** decimals`.
 *
 * Decimal fixed-point is the natural representation for quantities that
 * users reason about in base-10 terms, such as token amounts, currency, or
 * probabilities with decimal precision.
 *
 * @typeParam TSignedness - Whether the value can be negative.
 * @typeParam TTotalBits - The total number of bits used to store the raw value.
 * @typeParam TDecimals - The number of decimal digits to the right of the decimal point.
 *
 * @example
 * An unsigned 64-bit USDC amount with 6 decimals of precision:
 * ```ts
 * type Usdc = DecimalFixedPoint<'unsigned', 64, 6>;
 * ```
 *
 * @see {@link BinaryFixedPoint}
 * @see {@link Signedness}
 */
export type DecimalFixedPoint<TSignedness extends Signedness, TTotalBits extends number, TDecimals extends number> = {
    readonly decimals: TDecimals;
    readonly kind: 'decimalFixedPoint';
    readonly raw: bigint;
    readonly signedness: TSignedness;
    readonly totalBits: TTotalBits;
};

function createDecimalFixedPoint<TSignedness extends Signedness, TTotalBits extends number, TDecimals extends number>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    decimals: TDecimals,
    raw: bigint,
): DecimalFixedPoint<TSignedness, TTotalBits, TDecimals> {
    assertRawFitsInRange('decimalFixedPoint', signedness, totalBits, raw);
    return Object.freeze({ decimals, kind: 'decimalFixedPoint', raw, signedness, totalBits });
}

/**
 * Returns a factory that constructs {@link DecimalFixedPoint} values from
 * decimal strings.
 *
 * The outer call validates the shape parameters once and the returned
 * factory can be called many times to construct values of that shape.
 *
 * If the string carries more precision than the target `decimals` can
 * represent exactly, the returned factory throws
 * `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS` under the
 * default `'strict'` rounding mode. Pass a different {@link RoundingMode}
 * to allow a rounded result.
 *
 * @example
 * ```ts
 * const usdc = decimalFixedPoint('unsigned', 64, 6);
 * usdc('42.5');          // raw === 42500000n
 * usdc('0.0000001');     // throws under the default 'strict' mode
 * usdc('0.0000001', 'round'); // raw === 0n
 * ```
 *
 * @see {@link DecimalFixedPoint}
 * @see {@link rawDecimalFixedPoint}
 * @see {@link ratioDecimalFixedPoint}
 */
export function decimalFixedPoint<TSignedness extends Signedness, TTotalBits extends number, TDecimals extends number>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    decimals: TDecimals,
): (input: string, rounding?: RoundingMode) => DecimalFixedPoint<TSignedness, TTotalBits, TDecimals> {
    assertValidTotalBits('decimalFixedPoint', totalBits);
    assertValidDecimals(decimals);
    return (input, rounding = 'strict') => {
        const parsed = parseDecimalString('decimalFixedPoint', input);
        const raw =
            parsed.decimals <= decimals
                ? parsed.raw * 10n ** BigInt(decimals - parsed.decimals)
                : roundDivision(
                      'decimalFixedPoint',
                      'fromString',
                      parsed.raw,
                      10n ** BigInt(parsed.decimals - decimals),
                      rounding,
                  );
        return createDecimalFixedPoint(signedness, totalBits, decimals, raw);
    };
}

/**
 * Returns a factory that constructs {@link DecimalFixedPoint} values from a
 * raw bigint in the smallest representable unit (i.e. already scaled by
 * `10 ** decimals`).
 *
 * The outer call validates the shape parameters once and the returned
 * factory can be called many times to construct values of that shape.
 *
 * The raw value is range-checked against the claimed `totalBits` and
 * `signedness`; no rounding is ever required.
 *
 * @example
 * ```ts
 * const cents = rawDecimalFixedPoint('unsigned', 16, 2);
 * cents(425n); // Represents 4.25
 * ```
 *
 * @see {@link DecimalFixedPoint}
 * @see {@link decimalFixedPoint}
 * @see {@link ratioDecimalFixedPoint}
 */
export function rawDecimalFixedPoint<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TDecimals extends number,
>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    decimals: TDecimals,
): (raw: bigint) => DecimalFixedPoint<TSignedness, TTotalBits, TDecimals> {
    assertValidTotalBits('decimalFixedPoint', totalBits);
    assertValidDecimals(decimals);
    return raw => createDecimalFixedPoint(signedness, totalBits, decimals, raw);
}

/**
 * Returns a factory that constructs {@link DecimalFixedPoint} values from
 * a rational `numerator / denominator`.
 *
 * The outer call validates the shape parameters once and the returned
 * factory can be called many times to construct values of that shape.
 *
 * If the ratio cannot be exactly represented at the target `decimals`,
 * the returned factory throws
 * `SOLANA_ERROR__FIXED_POINTS__STRICT_MODE_PRECISION_LOSS` under the
 * default `'strict'` rounding mode. Pass a different {@link RoundingMode}
 * to allow a rounded result. Zero denominators always throw
 * `SOLANA_ERROR__FIXED_POINTS__INVALID_ZERO_DENOMINATOR_RATIO`.
 *
 * @example
 * ```ts
 * const probability = ratioDecimalFixedPoint('unsigned', 64, 4);
 * probability(1n, 4n);           // raw === 2500n (0.2500)
 * probability(1n, 3n);           // throws under 'strict'
 * probability(1n, 3n, 'floor');  // raw === 3333n
 * ```
 *
 * @see {@link DecimalFixedPoint}
 * @see {@link decimalFixedPoint}
 * @see {@link rawDecimalFixedPoint}
 */
export function ratioDecimalFixedPoint<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TDecimals extends number,
>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    decimals: TDecimals,
): (
    numerator: bigint,
    denominator: bigint,
    rounding?: RoundingMode,
) => DecimalFixedPoint<TSignedness, TTotalBits, TDecimals> {
    assertValidTotalBits('decimalFixedPoint', totalBits);
    assertValidDecimals(decimals);
    return (numerator, denominator, rounding = 'strict') => {
        if (denominator === 0n) {
            throw new SolanaError(SOLANA_ERROR__FIXED_POINTS__INVALID_ZERO_DENOMINATOR_RATIO, {
                denominator,
                kind: 'decimalFixedPoint',
                numerator,
            });
        }
        const raw = roundDivision(
            'decimalFixedPoint',
            'fromRatio',
            numerator * 10n ** BigInt(decimals),
            denominator,
            rounding,
        );
        return createDecimalFixedPoint(signedness, totalBits, decimals, raw);
    };
}
