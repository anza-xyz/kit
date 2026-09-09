import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { getBigIntWords, numberDecoderFactory, numberEncoderFactory, setBigIntWords } from './utils';

/**
 * Returns an encoder for 128-bit unsigned integers (`u128`).
 *
 * This encoder serializes `u128` values using sixteen bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * For more details, see {@link getU128Codec}.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeEncoder<number | bigint, 16>` for encoding `u128` values.
 *
 * @example
 * Encoding a `u128` value.
 * ```ts
 * const encoder = getU128Encoder();
 * const bytes = encoder.encode(42n); // 0x2a000000000000000000000000000000
 * ```
 *
 * @see {@link getU128Codec}
 */
export const getU128Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 16> =>
    numberEncoderFactory({
        config,
        name: 'u128',
        range: [0n, BigInt('0xffffffffffffffffffffffffffffffff')],
        set: (view, value, le) => setBigIntWords(view, value, le, 2, false),
        size: 16,
    });

/**
 * Returns a decoder for 128-bit unsigned integers (`u128`).
 *
 * This decoder deserializes `u128` values from sixteen bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * For more details, see {@link getU128Codec}.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeDecoder<bigint, 16>` for decoding `u128` values.
 *
 * @example
 * Decoding a `u128` value.
 * ```ts
 * const decoder = getU128Decoder();
 * const value = decoder.decode(new Uint8Array([0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])); // 42n
 * ```
 *
 * @see {@link getU128Codec}
 */
export const getU128Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<bigint, 16> =>
    numberDecoderFactory({
        config,
        get: (view, le) => getBigIntWords(view, le, 2, false),
        name: 'u128',
        size: 16,
    });

/**
 * Returns a codec for encoding and decoding 128-bit unsigned integers (`u128`).
 *
 * This codec serializes `u128` values using 16 bytes.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `bigint`.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number | bigint, bigint, 16>` for encoding and decoding `u128` values.
 *
 * @example
 * Encoding and decoding a `u128` value.
 * ```ts
 * const codec = getU128Codec();
 * const bytes = codec.encode(42); // 0x2a000000000000000000000000000000
 * const value = codec.decode(bytes); // 42n
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getU128Codec({ endian: Endian.Big });
 * const bytes = codec.encode(42); // 0x0000000000000000000000000000002a
 * ```
 *
 * @remarks
 * This codec supports values between `0` and `2^128 - 1`.
 * Since JavaScript `number` cannot safely represent values beyond `2^53 - 1`, the decoded value is always a `bigint`.
 *
 * - If you need a smaller unsigned integer, consider using {@link getU64Codec} or {@link getU32Codec}.
 * - If you need a larger unsigned integer, consider using {@link getU256Codec}.
 * - If you need signed integers, consider using {@link getI128Codec}.
 *
 * Separate {@link getU128Encoder} and {@link getU128Decoder} functions are available.
 *
 * ```ts
 * const bytes = getU128Encoder().encode(42);
 * const value = getU128Decoder().decode(bytes);
 * ```
 *
 * @see {@link getU128Encoder}
 * @see {@link getU128Decoder}
 */
export const getU128Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, bigint, 16> =>
    combineCodec(getU128Encoder(config), getU128Decoder(config));
