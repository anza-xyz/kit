import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 32-bit unsigned integers (`u32`).
 *
 * This encoder serializes `u32` values using four bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * For more details, see {@link getU32Codec}.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeEncoder<bigint | number, 4>` for encoding `u32` values.
 *
 * @example
 * Encoding a `u32` value.
 * ```ts
 * const encoder = getU32Encoder();
 * const bytes = encoder.encode(42); // 0x2a000000
 * ```
 *
 * @see {@link getU32Codec}
 */
export const getU32Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 4> =>
    numberEncoderFactory({
        config,
        name: 'u32',
        range: [0, Number('0xffffffff')],
        set: (view, value, le) => view.setUint32(0, Number(value), le),
        size: 4,
    });

/**
 * Returns a decoder for 32-bit unsigned integers (`u32`).
 *
 * This decoder deserializes `u32` values from four bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * For more details, see {@link getU32Codec}.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeDecoder<number, 4>` for decoding `u32` values.
 *
 * @example
 * Decoding a `u32` value.
 * ```ts
 * const decoder = getU32Decoder();
 * const value = decoder.decode(new Uint8Array([0x2a, 0x00, 0x00, 0x00])); // 42
 * ```
 *
 * @see {@link getU32Codec}
 */
export const getU32Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<number, 4> =>
    numberDecoderFactory({
        config,
        get: (view, le) => view.getUint32(0, le),
        name: 'u32',
        size: 4,
    });

/**
 * Returns a codec for encoding and decoding 32-bit unsigned integers (`u32`).
 *
 * This codec serializes `u32` values using four bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeCodec<bigint | number, number, 4>` for encoding and decoding `u32` values.
 *
 * @example
 * Encoding and decoding a `u32` value.
 * ```ts
 * const codec = getU32Codec();
 * const bytes = codec.encode(42); // 0x2a000000 (little-endian)
 * const value = codec.decode(bytes); // 42
 * ```
 *
 * @example
 * Storing values in big-endian format.
 * ```ts
 * const codec = getU32Codec({ endian: Endian.Big });
 * const bytes = codec.encode(42); // 0x0000002a
 * ```
 *
 * @remarks
 * This codec only supports values between `0` and `2^32 - 1`.
 * If you need a larger range, consider using {@link getU64Codec} or {@link getU128Codec}.
 * For signed integers, use {@link getI32Codec}.
 *
 * Separate {@link getU32Encoder} and {@link getU32Decoder} functions are available.
 *
 * ```ts
 * const bytes = getU32Encoder().encode(42);
 * const value = getU32Decoder().decode(bytes);
 * ```
 *
 * @see {@link getU32Encoder}
 * @see {@link getU32Decoder}
 */
export const getU32Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, number, 4> =>
    combineCodec(getU32Encoder(config), getU32Decoder(config));
