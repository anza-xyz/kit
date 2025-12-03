import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { NumberCodecConfig } from './common';
import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 128-bit signed integers (`i128`).
 *
 * This encoder serializes `i128` values using 16 bytes.
 * Values can be provided as either `number` or `bigint`.
 *
 * For more details, see {@link getI128Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeEncoder<number | bigint, 16>` for encoding `i128` values.
 *
 * @example
 * Encoding an `i128` value.
 * ```ts
 * const encoder = getI128Encoder();
 * const bytes = encoder.encode(-42n); // 0xd6ffffffffffffffffffffffffffffff
 * ```
 *
 * @see {@link getI128Codec}
 */
export const getI128Encoder = (config: NumberCodecConfig = {}): FixedSizeEncoder<bigint | number, 16> =>
    numberEncoderFactory({
        config,
        name: 'i128',
        range: [-BigInt('0x7fffffffffffffffffffffffffffffff') - 1n, BigInt('0x7fffffffffffffffffffffffffffffff')],
        set: (view, value, le) => {
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const rightMask = 0xffffffffffffffffn;
            view.setBigInt64(leftOffset, BigInt(value) >> 64n, le);
            view.setBigUint64(rightOffset, BigInt(value) & rightMask, le);
        },
        size: 16,
    });

/**
 * Returns a decoder for 128-bit signed integers (`i128`).
 *
 * This decoder deserializes `i128` values from 16 bytes.
 * The decoded value is always a `bigint`.
 *
 * For more details, see {@link getI128Codec}.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeDecoder<bigint, 16>` for decoding `i128` values.
 *
 * @example
 * Decoding an `i128` value.
 * ```ts
 * const decoder = getI128Decoder();
 * const value = decoder.decode(new Uint8Array([
 *   0xd6, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
 *   0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
 * ])); // -42n
 * ```
 *
 * @see {@link getI128Codec}
 */
export const getI128Decoder = (config: NumberCodecConfig = {}): FixedSizeDecoder<bigint, 16> =>
    numberDecoderFactory({
        config,
        get: (view, le) => {
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const left = view.getBigInt64(leftOffset, le);
            const right = view.getBigUint64(rightOffset, le);
            return (left << 64n) + right;
        },
        name: 'i128',
        size: 16,
    });

/**
 * Returns a codec for encoding and decoding 128-bit signed integers (`i128`).
 *
 * This codec serializes `i128` values using 16 bytes.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `bigint`.
 *
 * @param config - Optional configuration to specify endianness (little by default).
 * @returns A `FixedSizeCodec<number | bigint, bigint, 16>` for encoding and decoding `i128` values.
 *
 * @example
 * Encoding and decoding an `i128` value.
 * ```ts
 * const codec = getI128Codec();
 * const bytes = codec.encode(-42n); // 0xd6ffffffffffffffffffffffffffffff
 * const value = codec.decode(bytes); // -42n
 * ```
 *
 * @example
 * Using big-endian encoding.
 * ```ts
 * const codec = getI128Codec({ endian: Endian.Big });
 * const bytes = codec.encode(-42n); // 0xffffffffffffffffffffffffffffd6
 * ```
 *
 * @remarks
 * This codec supports values between `-2^127` and `2^127 - 1`.
 * Since JavaScript `number` cannot safely represent values beyond `2^53 - 1`, the decoded value is always a `bigint`.
 *
 * - If you need a smaller signed integer, consider using {@link getI64Codec} or {@link getI32Codec}.
 * - If you need a larger signed integer, consider using a custom codec.
 * - If you need unsigned integers, consider using {@link getU128Codec}.
 *
 * Separate {@link getI128Encoder} and {@link getI128Decoder} functions are available.
 *
 * ```ts
 * const bytes = getI128Encoder().encode(-42);
 * const value = getI128Decoder().decode(bytes);
 * ```
 *
 * @see {@link getI128Encoder}
 * @see {@link getI128Decoder}
 */
export const getI128Codec = (config: NumberCodecConfig = {}): FixedSizeCodec<bigint | number, bigint, 16> =>
    combineCodec(getI128Encoder(config), getI128Decoder(config));
