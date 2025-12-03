import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 8-bit signed integers (`i8`).
 *
 * This encoder serializes `i8` values using 1 byte.
 * Values can be provided as either `number` or `bigint`.
 *
 * For more details, see {@link getI8Codec}.
 *
 * @returns A `FixedSizeEncoder<number | bigint, 1>` for encoding `i8` values.
 *
 * @example
 * Encoding an `i8` value.
 * ```ts
 * const encoder = getI8Encoder();
 * const bytes = encoder.encode(-42); // 0xd6
 * ```
 *
 * @see {@link getI8Codec}
 */
export const getI8Encoder = (): FixedSizeEncoder<bigint | number, 1> =>
    numberEncoderFactory({
        name: 'i8',
        range: [-Number('0x7f') - 1, Number('0x7f')],
        set: (view, value) => view.setInt8(0, Number(value)),
        size: 1,
    });

/**
 * Returns a decoder for 8-bit signed integers (`i8`).
 *
 * This decoder deserializes `i8` values from 1 byte.
 * The decoded value is always a `number`.
 *
 * For more details, see {@link getI8Codec}.
 *
 * @returns A `FixedSizeDecoder<number, 1>` for decoding `i8` values.
 *
 * @example
 * Decoding an `i8` value.
 * ```ts
 * const decoder = getI8Decoder();
 * const value = decoder.decode(new Uint8Array([0xd6])); // -42
 * ```
 *
 * @see {@link getI8Codec}
 */
export const getI8Decoder = (): FixedSizeDecoder<number, 1> =>
    numberDecoderFactory({
        get: view => view.getInt8(0),
        name: 'i8',
        size: 1,
    });

/**
 * Returns a codec for encoding and decoding 8-bit signed integers (`i8`).
 *
 * This codec serializes `i8` values using 1 byte.
 * Values can be provided as either `number` or `bigint`, but the decoded value is always a `number`.
 *
 * @returns A `FixedSizeCodec<number | bigint, number, 1>` for encoding and decoding `i8` values.
 *
 * @example
 * Encoding and decoding an `i8` value.
 * ```ts
 * const codec = getI8Codec();
 * const bytes = codec.encode(-42); // 0xd6
 * const value = codec.decode(bytes); // -42
 * ```
 *
 * @remarks
 * This codec supports values between `-2^7` (`-128`) and `2^7 - 1` (`127`).
 *
 * - If you need a larger signed integer, consider using {@link getI16Codec}.
 * - If you need an unsigned integer, consider using {@link getU8Codec}.
 *
 * Separate {@link getI8Encoder} and {@link getI8Decoder} functions are available.
 *
 * ```ts
 * const bytes = getI8Encoder().encode(-42);
 * const value = getI8Decoder().decode(bytes);
 * ```
 *
 * @see {@link getI8Encoder}
 * @see {@link getI8Decoder}
 */
export const getI8Codec = (): FixedSizeCodec<bigint | number, number, 1> =>
    combineCodec(getI8Encoder(), getI8Decoder());
