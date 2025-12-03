import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 32-bit signed integers (`i32`).
 *
 * This encoder serializes `i32` values using 4 bytes.
 * Values can be provided as either `number` or `bigint`.
 *
 * For more details, see {@link getI32Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeEncoder<number | bigint, 4>` for encoding `i32` values.
 *
 * @example
 * Encoding an `i32` value.
 * ```ts
 * const encoder = getI32Encoder();
 * const bytes = encoder.encode(-42); // 0xd6ffffff
 * ```
 *
 * @see {@link getI32Codec}
 */
export const getI32Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 4> =>
    numberEncoderFactory({
        config,
        name: 'i32',
        range: [-Number('0x7fffffff') - 1, Number('0x7fffffff')],
        set: (view, value, le) => view.setInt32(0, Number(value), le),
        size: 4,
    });

/**
 * Returns a decoder for 32-bit signed integers (`i32`).
 *
 * This decoder deserializes `i32` values from 4 bytes.
 * The decoded value is always a `number`.
 *
 * For more details, see {@link getI32Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeDecoder<number, 4>` for decoding `i32` values.
 *
 * @example
 * Decoding an `i32` value.
 * ```ts
 * const decoder = getI32Decoder();
 * const value = decoder.decode(new Uint8Array([0xd6, 0xff, 0xff, 0xff])); // -42
 * ```
 *
 * @see {@link getI32Codec}
 */
export const getI32Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<number, 4> =>
    numberDecoderFactory({
        config,
        get: (view, le) => view.getInt32(0, le),
        name: 'i32',
        size: 4,
    });

/**
 * Returns a codec for encoding and decoding 32-bit signed integers (`i32`).
 *
 * This codec serializes `i32` values using 4 bytes.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `number`.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number | bigint, number, 4>` for encoding and decoding `i32` values.
 *
 * @example
 * Encoding and decoding an `i32` value.
 * ```ts
 * const codec = getI32Codec();
 * const bytes = codec.encode(-42); // 0xd6ffffff
 * const value = codec.decode(bytes); // -42
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getI32Codec({ endian: Endian.Big });
 * const bytes = codec.encode(-42); // 0xffffffd6
 * ```
 *
 * @remarks
 * This codec supports values between `-2^31` (`-2,147,483,648`) and `2^31 - 1` (`2,147,483,647`).
 *
 * - If you need a smaller signed integer, consider using {@link getI16Codec} or {@link getI8Codec}.
 * - If you need a larger signed integer, consider using {@link getI64Codec}.
 * - If you need unsigned integers, consider using {@link getU32Codec}.
 *
 * Separate {@link getI32Encoder} and {@link getI32Decoder} functions are available.
 *
 * ```ts
 * const bytes = getI32Encoder().encode(-42);
 * const value = getI32Decoder().decode(bytes);
 * ```
 *
 * @see {@link getI32Encoder}
 * @see {@link getI32Decoder}
 */
export const getI32Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, number, 4> =>
    combineCodec(getI32Encoder(config), getI32Decoder(config));
