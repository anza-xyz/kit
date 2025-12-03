import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 16-bit unsigned integers (`u16`).
 *
 * This encoder serializes `u16` values using two bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * For more details, see {@link getU16Codec}.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeEncoder<number | bigint, 2>` for encoding `u16` values.
 *
 * @example
 * Encoding a `u16` value.
 * ```ts
 * const encoder = getU16Encoder();
 * const bytes = encoder.encode(42); // 0x2a00
 * ```
 *
 * @see {@link getU16Codec}
 */
export const getU16Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 2> =>
    numberEncoderFactory({
        config,
        name: 'u16',
        range: [0, Number('0xffff')],
        set: (view, value, le) => view.setUint16(0, Number(value), le),
        size: 2,
    });

/**
 * Returns a decoder for 16-bit unsigned integers (`u16`).
 *
 * This decoder deserializes `u16` values from two bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * For more details, see {@link getU16Codec}.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeDecoder<number, 2>` for decoding `u16` values.
 *
 * @example
 * Decoding a `u16` value.
 * ```ts
 * const decoder = getU16Decoder();
 * const value = decoder.decode(new Uint8Array([0x2a, 0x00])); // 42
 * ```
 *
 * @see {@link getU16Codec}
 */
export const getU16Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<number, 2> =>
    numberDecoderFactory({
        config,
        get: (view, le) => view.getUint16(0, le),
        name: 'u16',
        size: 2,
    });

/**
 * Returns a codec for encoding and decoding 16-bit unsigned integers (`u16`).
 *
 * This codec serializes `u16` values using two bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeCodec<number | bigint, number, 2>` for encoding and decoding `u16` values.
 *
 * @example
 * Encoding and decoding a `u16` value.
 * ```ts
 * const codec = getU16Codec();
 * const bytes = codec.encode(42); // 0x2a00 (little-endian)
 * const value = codec.decode(bytes); // 42
 * ```
 *
 * @example
 * Storing values in big-endian format.
 * ```ts
 * const codec = getU16Codec({ endian: Endian.Big });
 * const bytes = codec.encode(42); // 0x002a
 * ```
 *
 * @remarks
 * This codec supports values between `0` and `2^16 - 1`.
 * If you need a larger range, consider using {@link getU32Codec} or {@link getU64Codec}.
 * For signed integers, use {@link getI16Codec}.
 *
 * Separate {@link getU16Encoder} and {@link getU16Decoder} functions are available.
 *
 * ```ts
 * const bytes = getU16Encoder().encode(42);
 * const value = getU16Decoder().decode(bytes);
 * ```
 *
 * @see {@link getU16Encoder}
 * @see {@link getU16Decoder}
 */
export const getU16Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, number, 2> =>
    combineCodec(getU16Encoder(config), getU16Decoder(config));
