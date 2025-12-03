import {
    combineCodec,
    createDecoder,
    createEncoder,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

/**
 * Returns an encoder for raw byte arrays.
 *
 * This encoder writes byte arrays exactly as provided without modification.
 *
 * The size of the encoded byte array is determined by the length of the input.
 * - To enforce a fixed size, consider using {@link fixEncoderSize}.
 * - To add a size prefix, use {@link addEncoderSizePrefix}.
 * - To add a sentinel value, use {@link addEncoderSentinel}.
 *
 * For more details, see {@link getBytesCodec}.
 *
 * @returns A `VariableSizeEncoder<ReadonlyUint8Array | Uint8Array>`.
 *
 * @example
 * Encoding a byte array as-is.
 * ```ts
 * const encoder = getBytesEncoder();
 *
 * encoder.encode(new Uint8Array([1, 2, 3])); // 0x010203
 * encoder.encode(new Uint8Array([255, 0, 127])); // 0xff007f
 * ```
 *
 * @see {@link getBytesCodec}
 */
export function getBytesEncoder(): VariableSizeEncoder<ReadonlyUint8Array | Uint8Array> {
    return createEncoder({
        getSizeFromValue: value => value.length,
        write: (value, bytes, offset) => {
            bytes.set(value, offset);
            return offset + value.length;
        },
    });
}

/**
 * Returns a decoder for raw byte arrays.
 *
 * This decoder reads byte arrays exactly as provided without modification.
 *
 * The decoded byte array extends from the provided offset to the end of the input.
 * - To enforce a fixed size, consider using {@link fixDecoderSize}.
 * - To add a size prefix, use {@link addDecoderSizePrefix}.
 * - To add a sentinel value, use {@link addDecoderSentinel}.
 *
 * For more details, see {@link getBytesCodec}.
 *
 * @returns A `VariableSizeDecoder<ReadonlyUint8Array>`.
 *
 * @example
 * Decoding a byte array as-is.
 * ```ts
 * const decoder = getBytesDecoder();
 *
 * decoder.decode(new Uint8Array([1, 2, 3])); // Uint8Array([1, 2, 3])
 * decoder.decode(new Uint8Array([255, 0, 127])); // Uint8Array([255, 0, 127])
 * ```
 *
 * @see {@link getBytesCodec}
 */
export function getBytesDecoder(): VariableSizeDecoder<ReadonlyUint8Array> {
    return createDecoder({
        read: (bytes, offset) => {
            const slice = bytes.slice(offset);
            return [slice, offset + slice.length];
        },
    });
}

/**
 * Returns a codec for encoding and decoding raw byte arrays.
 *
 * This codec serializes and deserializes byte arrays without modification.
 *
 * The size of the encoded and decoded byte array is determined dynamically.
 * This means, when reading, the codec will consume all remaining bytes in the input.
 * - To enforce a fixed size, consider using {@link fixCodecSize}.
 * - To add a size prefix, use {@link addCodecSizePrefix}.
 * - To add a sentinel value, use {@link addCodecSentinel}.
 *
 * @returns A `VariableSizeCodec<ReadonlyUint8Array | Uint8Array, ReadonlyUint8Array>`.
 *
 * @example
 * Encoding and decoding a byte array.
 * ```ts
 * const codec = getBytesCodec();
 *
 * codec.encode(new Uint8Array([1, 2, 3])); // 0x010203
 * codec.decode(new Uint8Array([255, 0, 127])); // Uint8Array([255, 0, 127])
 * ```
 *
 * @remarks
 * Separate {@link getBytesEncoder} and {@link getBytesDecoder} functions are available.
 *
 * ```ts
 * const bytes = getBytesEncoder().encode(new Uint8Array([1, 2, 3]));
 * const value = getBytesDecoder().decode(bytes);
 * ```
 *
 * @see {@link getBytesEncoder}
 * @see {@link getBytesDecoder}
 */
export function getBytesCodec(): VariableSizeCodec<ReadonlyUint8Array | Uint8Array, ReadonlyUint8Array> {
    return combineCodec(getBytesEncoder(), getBytesDecoder());
}
