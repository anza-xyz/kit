import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 64-bit unsigned integers (`u64`).
 *
 * This encoder serializes `u64` values using 8 bytes.
 * Values can be provided as either `number` or `bigint`.
 *
 * For more details, see {@link getU64Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeEncoder<number | bigint, 8>` for encoding `u64` values.
 *
 * @example
 * Encoding a `u64` value.
 * ```ts
 * const encoder = getU64Encoder();
 * const bytes = encoder.encode(42); // 0x2a00000000000000
 * ```
 *
 * @see {@link getU64Codec}
 */
export const getU64Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 8> =>
    numberEncoderFactory({
        config,
        name: 'u64',
        range: [0n, BigInt('0xffffffffffffffff')],
        set: (view, value, le) => view.setBigUint64(0, BigInt(value), le),
        size: 8,
    });

/**
 * Returns a decoder for 64-bit unsigned integers (`u64`).
 *
 * This decoder deserializes `u64` values from 8 bytes.
 * The decoded value is always a `bigint`.
 *
 * For more details, see {@link getU64Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeDecoder<bigint, 8>` for decoding `u64` values.
 *
 * @example
 * Decoding a `u64` value.
 * ```ts
 * const decoder = getU64Decoder();
 * const value = decoder.decode(new Uint8Array([0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])); // 42n
 * ```
 *
 * @see {@link getU64Codec}
 */
export const getU64Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<bigint, 8> =>
    numberDecoderFactory({
        config,
        get: (view, le) => view.getBigUint64(0, le),
        name: 'u64',
        size: 8,
    });

/**
 * Returns a codec for encoding and decoding 64-bit unsigned integers (`u64`).
 *
 * This codec serializes `u64` values using 8 bytes.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `bigint`.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number | bigint, bigint, 8>` for encoding and decoding `u64` values.
 *
 * @example
 * Encoding and decoding a `u64` value.
 * ```ts
 * const codec = getU64Codec();
 * const bytes = codec.encode(42); // 0x2a00000000000000
 * const value = codec.decode(bytes); // 42n
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getU64Codec({ endian: Endian.Big });
 * const bytes = codec.encode(42); // 0x000000000000002a
 * ```
 *
 * @remarks
 * This codec supports values between `0` and `2^64 - 1`.
 * Since JavaScript `number` cannot safely represent values beyond `2^53 - 1`, the decoded value is always a `bigint`.
 *
 * - If you need a smaller unsigned integer, consider using {@link getU32Codec} or {@link getU16Codec}.
 * - If you need a larger unsigned integer, consider using {@link getU128Codec}.
 * - If you need signed integers, consider using {@link getI64Codec}.
 *
 * Separate {@link getU64Encoder} and {@link getU64Decoder} functions are available.
 *
 * ```ts
 * const bytes = getU64Encoder().encode(42);
 * const value = getU64Decoder().decode(bytes);
 * ```
 *
 * @see {@link getU64Encoder}
 * @see {@link getU64Decoder}
 */
export const getU64Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, bigint, 8> =>
    combineCodec(getU64Encoder(config), getU64Decoder(config));
