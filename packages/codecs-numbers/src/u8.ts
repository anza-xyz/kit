import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import { numberDecoderFactory, numberEncoderFactory } from './utils';

/**
 * Returns an encoder for 8-bit unsigned integers (`u8`).
 *
 * This encoder serializes `u8` values using a single byte.
 *
 * For more details, see {@link getU8Codec}.
 *
 * @returns A `FixedSizeEncoder<number | bigint, 1>` for encoding `u8` values.
 *
 * @example
 * Encoding a `u8` value.
 * ```ts
 * const encoder = getU8Encoder();
 * const bytes = encoder.encode(42); // 0x2a
 * ```
 *
 * @see {@link getU8Codec}
 */
export const getU8Encoder = (): FixedSizeEncoder<bigint | number, 1> =>
    numberEncoderFactory({
        name: 'u8',
        range: [0, Number('0xff')],
        set: (view, value) => view.setUint8(0, Number(value)),
        size: 1,
    });

/**
 * Returns a decoder for 8-bit unsigned integers (`u8`).
 *
 * This decoder deserializes `u8` values from a single byte.
 *
 * For more details, see {@link getU8Codec}.
 *
 * @returns A `FixedSizeDecoder<number, 1>` for decoding `u8` values.
 *
 * @example
 * Decoding a `u8` value.
 * ```ts
 * const decoder = getU8Decoder();
 * const value = decoder.decode(new Uint8Array([0xff])); // 255
 * ```
 *
 * @see {@link getU8Codec}
 */
export const getU8Decoder = (): FixedSizeDecoder<number, 1> =>
    numberDecoderFactory({
        get: view => view.getUint8(0),
        name: 'u8',
        size: 1,
    });

/**
 * Returns a codec for encoding and decoding 8-bit unsigned integers (`u8`).
 *
 * This codec serializes `u8` values using a single byte.
 *
 * @returns A `FixedSizeCodec<number | bigint, number, 1>` for encoding and decoding `u8` values.
 *
 * @example
 * Encoding and decoding a `u8` value.
 * ```ts
 * const codec = getU8Codec();
 * const bytes = codec.encode(255); // 0xff
 * const value = codec.decode(bytes); // 255
 * ```
 *
 * @remarks
 * This codec supports values between `0` and `2^8 - 1` (0 to 255).
 * If you need larger integers, consider using {@link getU16Codec}, {@link getU32Codec}, or {@link getU64Codec}.
 * For signed integers, use {@link getI8Codec}.
 *
 * Separate {@link getU8Encoder} and {@link getU8Decoder} functions are available.
 *
 * ```ts
 * const bytes = getU8Encoder().encode(42);
 * const value = getU8Decoder().decode(bytes);
 * ```
 *
 * @see {@link getU8Encoder}
 * @see {@link getU8Decoder}
 */
export const getU8Codec = (): FixedSizeCodec<bigint | number, number, 1> =>
    combineCodec(getU8Encoder(), getU8Decoder());
