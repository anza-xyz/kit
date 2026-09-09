import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { getBigIntWords, numberDecoderFactory, numberEncoderFactory, setBigIntWords } from './utils';

/**
 * Returns an encoder for 256-bit unsigned integers (`u256`).
 *
 * This encoder serializes `u256` values using thirty-two bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * For more details, see {@link getU256Codec}.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeEncoder<number | bigint, 32>` for encoding `u256` values.
 *
 * @example
 * Encoding a `u256` value.
 * ```ts
 * const encoder = getU256Encoder();
 * const bytes = encoder.encode(42n); // 0x2a00000000000000000000000000000000000000000000000000000000000000
 * ```
 *
 * @see {@link getU256Codec}
 */
export const getU256Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 32> =>
    numberEncoderFactory({
        config,
        name: 'u256',
        range: [0n, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
        set: (view, value, le) => setBigIntWords(view, value, le, 4, false),
        size: 32,
    });

/**
 * Returns a decoder for 256-bit unsigned integers (`u256`).
 *
 * This decoder deserializes `u256` values from thirty-two bytes in little-endian format by default.
 * You may specify big-endian storage using the `endian` option.
 *
 * For more details, see {@link getU256Codec}.
 *
 * @param config - Optional settings for endianness.
 * @returns A `FixedSizeDecoder<bigint, 32>` for decoding `u256` values.
 *
 * @example
 * Decoding a `u256` value.
 * ```ts
 * const decoder = getU256Decoder();
 * const value = decoder.decode(new Uint8Array([
 *   0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 *   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 *   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 *   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
 * ])); // 42n
 * ```
 *
 * @see {@link getU256Codec}
 */
export const getU256Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<bigint, 32> =>
    numberDecoderFactory({
        config,
        get: (view, le) => getBigIntWords(view, le, 4, false),
        name: 'u256',
        size: 32,
    });

/**
 * Returns a codec for encoding and decoding 256-bit unsigned integers (`u256`).
 *
 * This codec serializes `u256` values using 32 bytes.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `bigint`.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number | bigint, bigint, 32>` for encoding and decoding `u256` values.
 *
 * @example
 * Encoding and decoding a `u256` value.
 * ```ts
 * const codec = getU256Codec();
 * const bytes = codec.encode(42); // 0x2a00000000000000000000000000000000000000000000000000000000000000
 * const value = codec.decode(bytes); // 42n
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getU256Codec({ endian: Endian.Big });
 * const bytes = codec.encode(42); // 0x000000000000000000000000000000000000000000000000000000000000002a
 * ```
 *
 * @remarks
 * This codec supports values between `0` and `2^256 - 1`.
 * Since JavaScript `number` cannot safely represent values beyond `2^53 - 1`, the decoded value is always a `bigint`.
 *
 * - If you need a smaller unsigned integer, consider using {@link getU128Codec} or {@link getU64Codec}.
 * - If you need signed integers, consider using {@link getI256Codec}.
 *
 * Separate {@link getU256Encoder} and {@link getU256Decoder} functions are available.
 *
 * ```ts
 * const bytes = getU256Encoder().encode(42);
 * const value = getU256Decoder().decode(bytes);
 * ```
 *
 * @see {@link getU256Encoder}
 * @see {@link getU256Decoder}
 */
export const getU256Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, bigint, 32> =>
    combineCodec(getU256Encoder(config), getU256Decoder(config));
