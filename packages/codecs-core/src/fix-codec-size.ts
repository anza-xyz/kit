import { assertByteArrayHasEnoughBytesForCodec } from './assertions';
import { fixBytes } from './bytes';
import {
    Codec,
    createDecoder,
    createEncoder,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    isFixedSize,
    Offset,
} from './codec';
import { combineCodec } from './combine-codec';

/**
 * Creates a fixed-size encoder from a given encoder.
 *
 * The resulting encoder ensures that encoded values always have the specified number of bytes.
 * If the original encoded value is larger than `fixedBytes`, it is truncated.
 * If it is smaller, it is padded with trailing zeroes.
 *
 * For more details, see {@link fixCodecSize}.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 *
 * @param encoder - The encoder to wrap into a fixed-size encoder.
 * @param fixedBytes - The fixed number of bytes to write.
 * @returns A `FixedSizeEncoder` that ensures a consistent output size.
 *
 * @example
 * ```ts
 * const encoder = fixEncoderSize(getUtf8Encoder(), 4);
 * encoder.encode("Hello"); // 0x48656c6c (truncated)
 * encoder.encode("Hi");    // 0x48690000 (padded)
 * encoder.encode("Hiya");  // 0x48697961 (same length)
 * ```
 *
 * @remarks
 * If you need a full codec with both encoding and decoding, use {@link fixCodecSize}.
 *
 * @see {@link fixCodecSize}
 * @see {@link fixDecoderSize}
 */
export function fixEncoderSize<TFrom, TSize extends number>(
    encoder: Encoder<TFrom>,
    fixedBytes: TSize,
): FixedSizeEncoder<TFrom, TSize> {
    return createEncoder({
        fixedSize: fixedBytes,
        write: (value: TFrom, bytes: Uint8Array, offset: Offset) => {
            // Here we exceptionally use the `encode` function instead of the `write`
            // function as using the nested `write` function on a fixed-sized byte
            // array may result in a out-of-bounds error on the nested encoder.
            const variableByteArray = encoder.encode(value);
            const fixedByteArray =
                variableByteArray.length > fixedBytes ? variableByteArray.slice(0, fixedBytes) : variableByteArray;
            bytes.set(fixedByteArray, offset);
            return offset + fixedBytes;
        },
    });
}

/**
 * Creates a fixed-size decoder from a given decoder.
 *
 * The resulting decoder always reads exactly `fixedBytes` bytes from the input.
 * If the nested decoder is also fixed-size, the bytes are truncated or padded as needed.
 *
 * For more details, see {@link fixCodecSize}.
 *
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 *
 * @param decoder - The decoder to wrap into a fixed-size decoder.
 * @param fixedBytes - The fixed number of bytes to read.
 * @returns A `FixedSizeDecoder` that ensures a consistent input size.
 *
 * @example
 * ```ts
 * const decoder = fixDecoderSize(getUtf8Decoder(), 4);
 * decoder.decode(new Uint8Array([72, 101, 108, 108, 111])); // "Hell" (truncated)
 * decoder.decode(new Uint8Array([72, 105, 0, 0]));          // "Hi" (zeroes ignored)
 * decoder.decode(new Uint8Array([72, 105, 121, 97]));       // "Hiya" (same length)
 * ```
 *
 * @remarks
 * If you need a full codec with both encoding and decoding, use {@link fixCodecSize}.
 *
 * @see {@link fixCodecSize}
 * @see {@link fixEncoderSize}
 */
export function fixDecoderSize<TTo, TSize extends number>(
    decoder: Decoder<TTo>,
    fixedBytes: TSize,
): FixedSizeDecoder<TTo, TSize> {
    return createDecoder({
        fixedSize: fixedBytes,
        read: (bytes, offset) => {
            assertByteArrayHasEnoughBytesForCodec('fixCodecSize', fixedBytes, bytes, offset);
            // Slice the byte array to the fixed size if necessary.
            if (offset > 0 || bytes.length > fixedBytes) {
                bytes = bytes.slice(offset, offset + fixedBytes);
            }
            // If the nested decoder is fixed-size, pad and truncate the byte array accordingly.
            if (isFixedSize(decoder)) {
                bytes = fixBytes(bytes, decoder.fixedSize);
            }
            // Decode the value using the nested decoder.
            const [value] = decoder.read(bytes, 0);
            return [value, offset + fixedBytes];
        },
    });
}

/**
 * Creates a fixed-size codec from a given codec.
 *
 * The resulting codec ensures that both encoding and decoding operate on a fixed number of bytes.
 * When encoding:
 * - If the encoded value is larger than `fixedBytes`, it is truncated.
 * - If it is smaller, it is padded with trailing zeroes.
 * - If it is exactly `fixedBytes`, it remains unchanged.
 *
 * When decoding:
 * - Exactly `fixedBytes` bytes are read from the input.
 * - If the nested decoder has a smaller fixed size, bytes are truncated or padded as necessary.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 *
 * @param codec - The codec to wrap into a fixed-size codec.
 * @param fixedBytes - The fixed number of bytes to read/write.
 * @returns A `FixedSizeCodec` that ensures both encoding and decoding conform to a fixed size.
 *
 * @example
 * ```ts
 * const codec = fixCodecSize(getUtf8Codec(), 4);
 *
 * const bytes1 = codec.encode("Hello"); // 0x48656c6c (truncated)
 * const value1 = codec.decode(bytes1);  // "Hell"
 *
 * const bytes2 = codec.encode("Hi");    // 0x48690000 (padded)
 * const value2 = codec.decode(bytes2);  // "Hi"
 *
 * const bytes3 = codec.encode("Hiya");  // 0x48697961 (same length)
 * const value3 = codec.decode(bytes3);  // "Hiya"
 * ```
 *
 * @remarks
 * If you only need to enforce a fixed size for encoding, use {@link fixEncoderSize}.
 * If you only need to enforce a fixed size for decoding, use {@link fixDecoderSize}.
 *
 * ```ts
 * const bytes = fixEncoderSize(getUtf8Encoder(), 4).encode("Hiya");
 * const value = fixDecoderSize(getUtf8Decoder(), 4).decode(bytes);
 * ```
 *
 * @see {@link fixEncoderSize}
 * @see {@link fixDecoderSize}
 */
export function fixCodecSize<TFrom, TTo extends TFrom, TSize extends number>(
    codec: Codec<TFrom, TTo>,
    fixedBytes: TSize,
): FixedSizeCodec<TFrom, TTo, TSize> {
    return combineCodec(fixEncoderSize(codec, fixedBytes), fixDecoderSize(codec, fixedBytes));
}
