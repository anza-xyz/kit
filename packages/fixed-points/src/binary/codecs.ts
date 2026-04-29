import {
    assertByteArrayHasEnoughBytesForCodec,
    assertByteArrayIsNotEmptyForCodec,
    combineCodec,
    createDecoder,
    createEncoder,
    type FixedSizeCodec,
    type FixedSizeDecoder,
    type FixedSizeEncoder,
} from '@solana/codecs-core';

import {
    assertFractionalBitsFitInTotalBits,
    assertShapeMatches,
    assertTotalBitsIsByteAligned,
    assertValidFractionalBits,
    assertValidTotalBits,
    describeShape,
} from '../assertions';
import { type BytesForTotalBits, type FixedPointCodecConfig, readRawBigInt, writeRawBigInt } from '../codecs';
import type { Signedness } from '../signedness';
import type { BinaryFixedPoint } from './core';

/**
 * Returns an encoder for {@link BinaryFixedPoint} values of a specific
 * shape. The encoder serializes `value.raw` as a fixed-size integer using
 * two's-complement for signed values and little-endian byte order by
 * default.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED` when
 * `totalBits` is not a multiple of 8. Encoding a value whose shape does
 * not match the codec's shape throws
 * `SOLANA_ERROR__FIXED_POINTS__SHAPE_MISMATCH`.
 *
 * @example
 * ```ts
 * const encoder = getBinaryFixedPointEncoder('signed', 16, 15);
 * encoder.encode(binaryFixedPoint('signed', 16, 15)('0.5')); // 0x0040
 * ```
 *
 * @see {@link getBinaryFixedPointDecoder}
 * @see {@link getBinaryFixedPointCodec}
 */
export function getBinaryFixedPointEncoder<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TFractionalBits extends number,
>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    fractionalBits: TFractionalBits,
    config: FixedPointCodecConfig = {},
): FixedSizeEncoder<BinaryFixedPoint<TSignedness, TTotalBits, TFractionalBits>, BytesForTotalBits<TTotalBits>> {
    assertValidTotalBits('binaryFixedPoint', totalBits);
    assertValidFractionalBits(fractionalBits);
    assertFractionalBitsFitInTotalBits(fractionalBits, totalBits);
    assertTotalBitsIsByteAligned('binaryFixedPoint', totalBits);
    const byteSize = (totalBits / 8) as BytesForTotalBits<TTotalBits>;
    const littleEndian = config.endian !== 'be';
    return createEncoder({
        fixedSize: byteSize,
        write(value, bytes, offset) {
            assertShapeMatches('getBinaryFixedPointEncoder', describeShape(value), {
                kind: 'binaryFixedPoint',
                scale: fractionalBits,
                scaleLabel: 'fractional bits',
                signedness,
                totalBits,
            });
            writeRawBigInt(bytes, offset, value.raw, byteSize, signedness, littleEndian);
            return offset + byteSize;
        },
    });
}

/**
 * Returns a decoder for {@link BinaryFixedPoint} values of a specific
 * shape. The decoder reads a fixed-size integer using two's-complement for
 * signed values and little-endian byte order by default, and reconstructs
 * a frozen {@link BinaryFixedPoint} from the bytes.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED` when
 * `totalBits` is not a multiple of 8.
 *
 * @example
 * ```ts
 * const decoder = getBinaryFixedPointDecoder('signed', 16, 15);
 * decoder.decode(new Uint8Array([0x00, 0x40])); // represents 0.5
 * ```
 *
 * @see {@link getBinaryFixedPointEncoder}
 * @see {@link getBinaryFixedPointCodec}
 */
export function getBinaryFixedPointDecoder<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TFractionalBits extends number,
>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    fractionalBits: TFractionalBits,
    config: FixedPointCodecConfig = {},
): FixedSizeDecoder<BinaryFixedPoint<TSignedness, TTotalBits, TFractionalBits>, BytesForTotalBits<TTotalBits>> {
    assertValidTotalBits('binaryFixedPoint', totalBits);
    assertValidFractionalBits(fractionalBits);
    assertFractionalBitsFitInTotalBits(fractionalBits, totalBits);
    assertTotalBitsIsByteAligned('binaryFixedPoint', totalBits);
    const byteSize = (totalBits / 8) as BytesForTotalBits<TTotalBits>;
    const littleEndian = config.endian !== 'be';
    const codecDescription = 'getBinaryFixedPointDecoder';
    return createDecoder({
        fixedSize: byteSize,
        read(bytes, offset) {
            assertByteArrayIsNotEmptyForCodec(codecDescription, bytes, offset);
            assertByteArrayHasEnoughBytesForCodec(codecDescription, byteSize, bytes, offset);
            const raw = readRawBigInt(bytes, offset, byteSize, signedness, littleEndian);
            const value = Object.freeze({
                fractionalBits,
                kind: 'binaryFixedPoint',
                raw,
                signedness,
                totalBits,
            }) as BinaryFixedPoint<TSignedness, TTotalBits, TFractionalBits>;
            return [value, offset + byteSize];
        },
    });
}

/**
 * Returns a codec for {@link BinaryFixedPoint} values of a specific shape,
 * combining {@link getBinaryFixedPointEncoder} and
 * {@link getBinaryFixedPointDecoder}.
 *
 * @example
 * ```ts
 * const codec = getBinaryFixedPointCodec('signed', 16, 15);
 * const bytes = codec.encode(binaryFixedPoint('signed', 16, 15)('0.5'));
 * const value = codec.decode(bytes); // represents 0.5
 * ```
 *
 * @see {@link getBinaryFixedPointEncoder}
 * @see {@link getBinaryFixedPointDecoder}
 */
export function getBinaryFixedPointCodec<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TFractionalBits extends number,
>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    fractionalBits: TFractionalBits,
    config: FixedPointCodecConfig = {},
): FixedSizeCodec<
    BinaryFixedPoint<TSignedness, TTotalBits, TFractionalBits>,
    BinaryFixedPoint<TSignedness, TTotalBits, TFractionalBits>,
    BytesForTotalBits<TTotalBits>
> {
    return combineCodec(
        getBinaryFixedPointEncoder(signedness, totalBits, fractionalBits, config),
        getBinaryFixedPointDecoder(signedness, totalBits, fractionalBits, config),
    );
}
