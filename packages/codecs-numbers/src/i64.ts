import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 64-bit signed integers (`i64`).
 *
 * This encoder serializes `i64` values using 8 bytes.
 * Values can be provided as either `number` or `bigint`.
 *
 * For more details, see {@link getI64Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeEncoder<number | bigint, 8>` for encoding `i64` values.
 *
 * @example
 * Encoding an `i64` value.
 * ```ts
 * const encoder = getI64Encoder();
 * const bytes = encoder.encode(-42n); // 0xd6ffffffffffffff
 * ```
 *
 * @see {@link getI64Codec}
 */
export const getI64Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 8> =>
    numberEncoderFactory({
        config,
        name: 'i64',
        range: [-BigInt('0x7fffffffffffffff') - 1n, BigInt('0x7fffffffffffffff')],
        set: (view, value, le) => view.setBigInt64(0, BigInt(value), le),
        size: 8,
    });

/**
 * Returns a decoder for 64-bit signed integers (`i64`).
 *
 * This decoder deserializes `i64` values from 8 bytes.
 * The decoded value is always a `bigint`.
 *
 * For more details, see {@link getI64Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeDecoder<bigint, 8>` for decoding `i64` values.
 *
 * @example
 * Decoding an `i64` value.
 * ```ts
 * const decoder = getI64Decoder();
 * const value = decoder.decode(new Uint8Array([
 *   0xd6, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
 * ])); // -42n
 * ```
 *
 * @see {@link getI64Codec}
 */
export const getI64Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<bigint, 8> =>
    numberDecoderFactory({
        config,
        get: (view, le) => view.getBigInt64(0, le),
        name: 'i64',
        size: 8,
    });

/**
 * Returns a codec for encoding and decoding 64-bit signed integers (`i64`).
 *
 * This codec serializes `i64` values using 8 bytes.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `bigint`.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number | bigint, bigint, 8>` for encoding and decoding `i64` values.
 *
 * @example
 * Encoding and decoding an `i64` value.
 * ```ts
 * const codec = getI64Codec();
 * const bytes = codec.encode(-42n); // 0xd6ffffffffffffff
 * const value = codec.decode(bytes); // -42n
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getI64Codec({ endian: Endian.Big });
 * const bytes = codec.encode(-42n); // 0xffffffffffffffd6
 * ```
 *
 * @remarks
 * This codec supports values between `-2^63` and `2^63 - 1`.
 * Since JavaScript `number` cannot safely represent values beyond `2^53 - 1`, the decoded value is always a `bigint`.
 *
 * - If you need a smaller signed integer, consider using {@link getI32Codec} or {@link getI16Codec}.
 * - If you need a larger signed integer, consider using {@link getI128Codec}.
 * - If you need unsigned integers, consider using {@link getU64Codec}.
 *
 * Separate {@link getI64Encoder} and {@link getI64Decoder} functions are available.
 *
 * ```ts
 * const bytes = getI64Encoder().encode(-42);
 * const value = getI64Decoder().decode(bytes);
 * ```
 *
 * @see {@link getI64Encoder}
 * @see {@link getI64Decoder}
 */
export const getI64Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, bigint, 8> =>
    combineCodec(getI64Encoder(config), getI64Decoder(config));
