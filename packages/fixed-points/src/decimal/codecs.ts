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
    assertShapeMatches,
    assertTotalBitsIsByteAligned,
    assertValidDecimals,
    assertValidTotalBits,
    describeShape,
} from '../assertions';
import { type BytesForTotalBits, type FixedPointCodecConfig, readRawBigInt, writeRawBigInt } from '../codecs';
import type { Signedness } from '../signedness';
import type { DecimalFixedPoint } from './core';

/**
 * Returns an encoder for {@link DecimalFixedPoint} values of a specific
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
 * const encoder = getDecimalFixedPointEncoder('unsigned', 64, 6);
 * encoder.encode(decimalFixedPoint('unsigned', 64, 6)('42.5'));
 * ```
 *
 * @see {@link getDecimalFixedPointDecoder}
 * @see {@link getDecimalFixedPointCodec}
 */
export function getDecimalFixedPointEncoder<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TDecimals extends number,
>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    decimals: TDecimals,
    config: FixedPointCodecConfig = {},
): FixedSizeEncoder<DecimalFixedPoint<TSignedness, TTotalBits, TDecimals>, BytesForTotalBits<TTotalBits>> {
    assertValidTotalBits('decimalFixedPoint', totalBits);
    assertValidDecimals(decimals);
    assertTotalBitsIsByteAligned('decimalFixedPoint', totalBits);
    const byteSize = (totalBits / 8) as BytesForTotalBits<TTotalBits>;
    const littleEndian = config.endian !== 'be';
    return createEncoder({
        fixedSize: byteSize,
        write(value, bytes, offset) {
            assertShapeMatches('getDecimalFixedPointEncoder', describeShape(value), {
                kind: 'decimalFixedPoint',
                scale: decimals,
                scaleLabel: 'decimals',
                signedness,
                totalBits,
            });
            writeRawBigInt(bytes, offset, value.raw, byteSize, signedness, littleEndian);
            return offset + byteSize;
        },
    });
}

/**
 * Returns a decoder for {@link DecimalFixedPoint} values of a specific
 * shape. The decoder reads a fixed-size integer using two's-complement for
 * signed values and little-endian byte order by default, and reconstructs
 * a frozen {@link DecimalFixedPoint} from the bytes.
 *
 * Throws `SOLANA_ERROR__FIXED_POINTS__TOTAL_BITS_NOT_BYTE_ALIGNED` when
 * `totalBits` is not a multiple of 8.
 *
 * @example
 * ```ts
 * const decoder = getDecimalFixedPointDecoder('unsigned', 64, 6);
 * decoder.decode(bytes); // represents 42.5 for appropriately encoded bytes
 * ```
 *
 * @see {@link getDecimalFixedPointEncoder}
 * @see {@link getDecimalFixedPointCodec}
 */
export function getDecimalFixedPointDecoder<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TDecimals extends number,
>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    decimals: TDecimals,
    config: FixedPointCodecConfig = {},
): FixedSizeDecoder<DecimalFixedPoint<TSignedness, TTotalBits, TDecimals>, BytesForTotalBits<TTotalBits>> {
    assertValidTotalBits('decimalFixedPoint', totalBits);
    assertValidDecimals(decimals);
    assertTotalBitsIsByteAligned('decimalFixedPoint', totalBits);
    const byteSize = (totalBits / 8) as BytesForTotalBits<TTotalBits>;
    const littleEndian = config.endian !== 'be';
    const codecDescription = 'getDecimalFixedPointDecoder';
    return createDecoder({
        fixedSize: byteSize,
        read(bytes, offset) {
            assertByteArrayIsNotEmptyForCodec(codecDescription, bytes, offset);
            assertByteArrayHasEnoughBytesForCodec(codecDescription, byteSize, bytes, offset);
            const raw = readRawBigInt(bytes, offset, byteSize, signedness, littleEndian);
            const value = Object.freeze({
                decimals,
                kind: 'decimalFixedPoint',
                raw,
                signedness,
                totalBits,
            }) as DecimalFixedPoint<TSignedness, TTotalBits, TDecimals>;
            return [value, offset + byteSize];
        },
    });
}

/**
 * Returns a codec for {@link DecimalFixedPoint} values of a specific
 * shape, combining {@link getDecimalFixedPointEncoder} and
 * {@link getDecimalFixedPointDecoder}.
 *
 * @example
 * ```ts
 * const codec = getDecimalFixedPointCodec('unsigned', 64, 6);
 * const bytes = codec.encode(decimalFixedPoint('unsigned', 64, 6)('42.5'));
 * const value = codec.decode(bytes); // represents 42.5
 * ```
 *
 * @see {@link getDecimalFixedPointEncoder}
 * @see {@link getDecimalFixedPointDecoder}
 */
export function getDecimalFixedPointCodec<
    TSignedness extends Signedness,
    TTotalBits extends number,
    TDecimals extends number,
>(
    signedness: TSignedness,
    totalBits: TTotalBits,
    decimals: TDecimals,
    config: FixedPointCodecConfig = {},
): FixedSizeCodec<
    DecimalFixedPoint<TSignedness, TTotalBits, TDecimals>,
    DecimalFixedPoint<TSignedness, TTotalBits, TDecimals>,
    BytesForTotalBits<TTotalBits>
> {
    return combineCodec(
        getDecimalFixedPointEncoder(signedness, totalBits, decimals, config),
        getDecimalFixedPointDecoder(signedness, totalBits, decimals, config),
    );
}
