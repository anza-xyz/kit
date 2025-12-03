import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 32-bit floating-point numbers (`f32`).
 *
 * This encoder serializes `f32` values using 4 bytes.
 * Floating-point values may lose precision when encoded.
 *
 * For more details, see {@link getF32Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeEncoder<number, 4>` for encoding `f32` values.
 *
 * @example
 * Encoding an `f32` value.
 * ```ts
 * const encoder = getF32Encoder();
 * const bytes = encoder.encode(-1.5); // 0x0000c0bf
 * ```
 *
 * @see {@link getF32Codec}
 */
export const getF32Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 4> =>
    numberEncoderFactory({
        config,
        name: 'f32',
        set: (view, value, le) => view.setFloat32(0, Number(value), le),
        size: 4,
    });

/**
 * Returns a decoder for 32-bit floating-point numbers (`f32`).
 *
 * This decoder deserializes `f32` values from 4 bytes.
 * Some precision may be lost during decoding due to floating-point representation.
 *
 * For more details, see {@link getF32Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeDecoder<number, 4>` for decoding `f32` values.
 *
 * @example
 * Decoding an `f32` value.
 * ```ts
 * const decoder = getF32Decoder();
 * const value = decoder.decode(new Uint8Array([0x00, 0x00, 0xc0, 0xbf])); // -1.5
 * ```
 *
 * @see {@link getF32Codec}
 */
export const getF32Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<number, 4> =>
    numberDecoderFactory({
        config,
        get: (view, le) => view.getFloat32(0, le),
        name: 'f32',
        size: 4,
    });

/**
 * Returns a codec for encoding and decoding 32-bit floating-point numbers (`f32`).
 *
 * This codec serializes `f32` values using 4 bytes.
 * Due to the IEEE 754 floating-point representation, some precision loss may occur.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number, number, 4>` for encoding and decoding `f32` values.
 *
 * @example
 * Encoding and decoding an `f32` value.
 * ```ts
 * const codec = getF32Codec();
 * const bytes = codec.encode(-1.5); // 0x0000c0bf
 * const value = codec.decode(bytes); // -1.5
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getF32Codec({ endian: Endian.Big });
 * const bytes = codec.encode(-1.5); // 0xbfc00000
 * ```
 *
 * @remarks
 * `f32` values follow the IEEE 754 single-precision floating-point standard.
 * Precision loss may occur for certain values.
 *
 * - If you need higher precision, consider using {@link getF64Codec}.
 * - If you need integer values, consider using {@link getI32Codec} or {@link getU32Codec}.
 *
 * Separate {@link getF32Encoder} and {@link getF32Decoder} functions are available.
 *
 * ```ts
 * const bytes = getF32Encoder().encode(-1.5);
 * const value = getF32Decoder().decode(bytes);
 * ```
 *
 * @see {@link getF32Encoder}
 * @see {@link getF32Decoder}
 */
export const getF32Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, number, 4> =>
    combineCodec(getF32Encoder(config), getF32Decoder(config));
