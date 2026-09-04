import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { getBigIntWords, numberDecoderFactory, numberEncoderFactory, setBigIntWords } from './utils';

/**
 * Returns an encoder for 256-bit signed integers (`i256`).
 *
 * This encoder serializes `i256` values using 32 bytes.
 * Values can be provided as either `number` or `bigint`.
 *
 * For more details, see {@link getI256Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeEncoder<number | bigint, 32>` for encoding `i256` values.
 *
 * @example
 * Encoding an `i256` value.
 * ```ts
 * const encoder = getI256Encoder();
 * const bytes = encoder.encode(-42n); // 0xd6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 * ```
 *
 * @see {@link getI256Codec}
 */
export const getI256Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 32> =>
    numberEncoderFactory({
        config,
        name: 'i256',
        range: [
            -BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') - 1n,
            BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        ],
        set: (view, value, le) => setBigIntWords(view, value, le, 4, true),
        size: 32,
    });

/**
 * Returns a decoder for 256-bit signed integers (`i256`).
 *
 * This decoder deserializes `i256` values from 32 bytes.
 * The decoded value is always a `bigint`.
 *
 * For more details, see {@link getI256Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeDecoder<bigint, 32>` for decoding `i256` values.
 *
 * @example
 * Decoding an `i256` value.
 * ```ts
 * const decoder = getI256Decoder();
 * const value = decoder.decode(new Uint8Array([
 *   0xd6, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
 *   0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
 *   0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
 *   0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
 * ])); // -42n
 * ```
 *
 * @see {@link getI256Codec}
 */
export const getI256Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<bigint, 32> =>
    numberDecoderFactory({
        config,
        get: (view, le) => getBigIntWords(view, le, 4, true),
        name: 'i256',
        size: 32,
    });

/**
 * Returns a codec for encoding and decoding 256-bit signed integers (`i256`).
 *
 * This codec serializes `i256` values using 32 bytes.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `bigint`.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number | bigint, bigint, 32>` for encoding and decoding `i256` values.
 *
 * @example
 * Encoding and decoding an `i256` value.
 * ```ts
 * const codec = getI256Codec();
 * const bytes = codec.encode(-42n); // 0xd6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
 * const value = codec.decode(bytes); // -42n
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getI256Codec({ endian: Endian.Big });
 * const bytes = codec.encode(-42n); // 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd6
 * ```
 *
 * @remarks
 * This codec supports values between `-2^255` and `2^255 - 1`.
 * Since JavaScript `number` cannot safely represent values beyond `2^53 - 1`, the decoded value is always a `bigint`.
 *
 * - If you need a smaller signed integer, consider using {@link getI128Codec} or {@link getI64Codec}.
 * - If you need a larger signed integer, consider using a custom codec.
 * - If you need unsigned integers, consider using {@link getU256Codec}.
 *
 * Separate {@link getI256Encoder} and {@link getI256Decoder} functions are available.
 *
 * ```ts
 * const bytes = getI256Encoder().encode(-42);
 * const value = getI256Decoder().decode(bytes);
 * ```
 *
 * @see {@link getI256Encoder}
 * @see {@link getI256Decoder}
 */
export const getI256Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, bigint, 32> =>
    combineCodec(getI256Encoder(config), getI256Decoder(config));
