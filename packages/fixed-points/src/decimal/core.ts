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
