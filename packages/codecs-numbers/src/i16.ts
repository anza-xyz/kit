import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 16-bit signed integers (`i16`).
 *
 * This encoder serializes `i16` values using 2 bytes.
 * Values can be provided as either `number` or `bigint`.
 *
 * For more details, see {@link getI16Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeEncoder<number | bigint, 2>` for encoding `i16` values.
 *
 * @example
 * Encoding an `i16` value.
 * ```ts
 * const encoder = getI16Encoder();
 * const bytes = encoder.encode(-42); // 0xd6ff
 * ```
 *
 * @see {@link getI16Codec}
 */
export const getI16Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 2> =>
    numberEncoderFactory({
        config,
        name: 'i16',
        range: [-Number('0x7fff') - 1, Number('0x7fff')],
        set: (view, value, le) => view.setInt16(0, Number(value), le),
        size: 2,
    });

/**
 * Returns a decoder for 16-bit signed integers (`i16`).
 *
 * This decoder deserializes `i16` values from 2 bytes.
 * The decoded value is always a `number`.
 *
 * For more details, see {@link getI16Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeDecoder<number, 2>` for decoding `i16` values.
 *
 * @example
 * Decoding an `i16` value.
 * ```ts
 * const decoder = getI16Decoder();
 * const value = decoder.decode(new Uint8Array([0xd6, 0xff])); // -42
 * ```
 *
 * @see {@link getI16Codec}
 */
export const getI16Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<number, 2> =>
    numberDecoderFactory({
        config,
        get: (view, le) => view.getInt16(0, le),
        name: 'i16',
        size: 2,
    });

/**
 * Returns a codec for encoding and decoding 16-bit signed integers (`i16`).
 *
 * This codec serializes `i16` values using 2 bytes.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `number`.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number | bigint, number, 2>` for encoding and decoding `i16` values.
 *
 * @example
 * Encoding and decoding an `i16` value.
 * ```ts
 * const codec = getI16Codec();
 * const bytes = codec.encode(-42); // 0xd6ff
 * const value = codec.decode(bytes); // -42
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getI16Codec({ endian: Endian.Big });
 * const bytes = codec.encode(-42); // 0xffd6
 * ```
 *
 * @remarks
 * This codec supports values between `-2^15` (`-32,768`) and `2^15 - 1` (`32,767`).
 *
 * - If you need a smaller signed integer, consider using {@link getI8Codec}.
 * - If you need a larger signed integer, consider using {@link getI32Codec}.
 * - If you need unsigned integers, consider using {@link getU16Codec}.
 *
 * Separate {@link getI16Encoder} and {@link getI16Decoder} functions are available.
 *
 * ```ts
 * const bytes = getI16Encoder().encode(-42);
 * const value = getI16Decoder().decode(bytes);
 * ```
 *
 * @see {@link getI16Encoder}
 * @see {@link getI16Decoder}
 */
export const getI16Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, number, 2> =>
    combineCodec(getI16Encoder(config), getI16Decoder(config));
