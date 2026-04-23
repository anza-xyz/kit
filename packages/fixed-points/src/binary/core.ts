import type { Signedness } from '../signedness';

/**
 * A fixed-point number whose scale is a power of 2. The stored `raw` bigint
 * represents the mathematical value `raw / 2 ** fractionalBits`.
 *
 * Binary fixed-point is the fastest fractional representation to compute
 * with — rescaling is a bit shift — so it is the preferred choice for
 * audio samples, graphics, probabilities, and any other quantity where
 * performance matters and the scale does not need to align with decimal
 * digits.
 *
 * @typeParam TSignedness - Whether the value can be negative.
 * @typeParam TTotalBits - The total number of bits used to store the raw value.
 * @typeParam TFractionalBits - The number of bits to the right of the binary point.
 *
 * @example
 * A 16-bit signed Q1.15 audio sample:
 * ```ts
 * type AudioSample = BinaryFixedPoint<'signed', 16, 15>;
 * ```
 *
 * @see {@link DecimalFixedPoint}
 * @see {@link Signedness}
 */
export type BinaryFixedPoint<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TFractionalBits extends number,
> = {
    readonly fractionalBits: TFractionalBits;
    readonly kind: 'binaryFixedPoint';
    readonly raw: bigint;
    readonly signedness: TSignedness;
    readonly totalBits: TTotalBits;
};
