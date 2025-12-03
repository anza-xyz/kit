import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 64-bit floating-point numbers (`f64`).
 *
 * This encoder serializes `f64` values using 8 bytes.
 * Floating-point values may lose precision when encoded.
 *
 * For more details, see {@link getF64Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeEncoder<number, 8>` for encoding `f64` values.
 *
 * @example
 * Encoding an `f64` value.
 * ```ts
 * const encoder = getF64Encoder();
 * const bytes = encoder.encode(-1.5); // 0x000000000000f8bf
 * ```
 *
 * @see {@link getF64Codec}
 */
export const getF64Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 8> =>
    numberEncoderFactory({
        config,
        name: 'f64',
        set: (view, value, le) => view.setFloat64(0, Number(value), le),
        size: 8,
    });

/**
 * Returns a decoder for 64-bit floating-point numbers (`f64`).
 *
 * This decoder deserializes `f64` values from 8 bytes.
 * Some precision may be lost during decoding due to floating-point representation.
 *
 * For more details, see {@link getF64Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeDecoder<number, 8>` for decoding `f64` values.
 *
 * @example
 * Decoding an `f64` value.
 * ```ts
 * const decoder = getF64Decoder();
 * const value = decoder.decode(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf8, 0xbf])); // -1.5
 * ```
 *
 * @see {@link getF64Codec}
 */
export const getF64Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<number, 8> =>
    numberDecoderFactory({
        config,
        get: (view, le) => view.getFloat64(0, le),
        name: 'f64',
        size: 8,
    });

/**
 * Returns a codec for encoding and decoding 64-bit floating-point numbers (`f64`).
 *
 * This codec serializes `f64` values using 8 bytes.
 * Due to the IEEE 754 floating-point representation, some precision loss may occur.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number, number, 8>` for encoding and decoding `f64` values.
 *
 * @example
 * Encoding and decoding an `f64` value.
 * ```ts
 * const codec = getF64Codec();
 * const bytes = codec.encode(-1.5); // 0x000000000000f8bf
 * const value = codec.decode(bytes); // -1.5
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getF64Codec({ endian: Endian.Big });
 * const bytes = codec.encode(-1.5); // 0xbff8000000000000
 * ```
 *
 * @remarks
 * `f64` values follow the IEEE 754 double-precision floating-point standard.
 * Precision loss may still occur but is significantly lower than `f32`.
 *
 * - If you need smaller floating-point values, consider using {@link getF32Codec}.
 * - If you need integer values, consider using {@link getI64Codec} or {@link getU64Codec}.
 *
 * Separate {@link getF64Encoder} and {@link getF64Decoder} functions are available.
 *
 * ```ts
 * const bytes = getF64Encoder().encode(-1.5);
 * const value = getF64Decoder().decode(bytes);
 * ```
 *
 * @see {@link getF64Encoder}
 * @see {@link getF64Decoder}
 */
export const getF64Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, number, 8> =>
    combineCodec(getF64Encoder(config), getF64Decoder(config));
