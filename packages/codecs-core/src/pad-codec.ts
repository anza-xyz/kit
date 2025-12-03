import { Codec, Decoder, Encoder, Offset } from './codec';
import { combineCodec } from './combine-codec';
import { offsetDecoder, offsetEncoder } from './offset-codec';
import { resizeDecoder, resizeEncoder } from './resize-codec';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEncoder = Encoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDecoder = Decoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCodec = Codec<any>;

/**
 * Adds left padding to the given encoder, shifting the encoded value forward
 * by `offset` bytes whilst increasing the size of the encoder accordingly.
 *
 * For more details, see {@link padLeftCodec}.
 *
 * @typeParam TFrom - The type of the value to encode.
 *
 * @param encoder - The encoder to pad.
 * @param offset - The number of padding bytes to add before encoding.
 * @returns A new encoder with left padding applied.
 *
 * @example
 * ```ts
 * const encoder = padLeftEncoder(getU16Encoder(), 2);
 * const bytes = encoder.encode(0xffff); // 0x0000ffff (0xffff written at offset 2)
 * ```
 *
 * @see {@link padLeftCodec}
 * @see {@link padLeftDecoder}
 */
export function padLeftEncoder<TEncoder extends AnyEncoder>(encoder: TEncoder, offset: Offset): TEncoder {
    return offsetEncoder(
        resizeEncoder(encoder, size => size + offset),
        { preOffset: ({ preOffset }) => preOffset + offset },
    );
}

/**
 * Adds right padding to the given encoder, extending the encoded value by `offset`
 * bytes whilst increasing the size of the encoder accordingly.
 *
 * For more details, see {@link padRightCodec}.
 *
 * @typeParam TFrom - The type of the value to encode.
 *
 * @param encoder - The encoder to pad.
 * @param offset - The number of padding bytes to add after encoding.
 * @returns A new encoder with right padding applied.
 *
 * @example
 * ```ts
 * const encoder = padRightEncoder(getU16Encoder(), 2);
 * const bytes = encoder.encode(0xffff); // 0xffff0000 (two extra bytes added at the end)
 * ```
 *
 * @see {@link padRightCodec}
 * @see {@link padRightDecoder}
 */
export function padRightEncoder<TEncoder extends AnyEncoder>(encoder: TEncoder, offset: Offset): TEncoder {
    return offsetEncoder(
        resizeEncoder(encoder, size => size + offset),
        { postOffset: ({ postOffset }) => postOffset + offset },
    );
}

/**
 * Adds left padding to the given decoder, shifting the decoding position forward
 * by `offset` bytes whilst increasing the size of the decoder accordingly.
 *
 * For more details, see {@link padLeftCodec}.
 *
 * @typeParam TTo - The type of the decoded value.
 *
 * @param decoder - The decoder to pad.
 * @param offset - The number of padding bytes to skip before decoding.
 * @returns A new decoder with left padding applied.
 *
 * @example
 * ```ts
 * const decoder = padLeftDecoder(getU16Decoder(), 2);
 * const value = decoder.decode(new Uint8Array([0, 0, 0x12, 0x34])); // 0xffff (reads from offset 2)
 * ```
 *
 * @see {@link padLeftCodec}
 * @see {@link padLeftEncoder}
 */
export function padLeftDecoder<TDecoder extends AnyDecoder>(decoder: TDecoder, offset: Offset): TDecoder {
    return offsetDecoder(
        resizeDecoder(decoder, size => size + offset),
        { preOffset: ({ preOffset }) => preOffset + offset },
    );
}

/**
 * Adds right padding to the given decoder, extending the post-offset by `offset`
 * bytes whilst increasing the size of the decoder accordingly.
 *
 * For more details, see {@link padRightCodec}.
 *
 * @typeParam TTo - The type of the decoded value.
 *
 * @param decoder - The decoder to pad.
 * @param offset - The number of padding bytes to skip after decoding.
 * @returns A new decoder with right padding applied.
 *
 * @example
 * ```ts
 * const decoder = padRightDecoder(getU16Decoder(), 2);
 * const value = decoder.decode(new Uint8Array([0x12, 0x34, 0, 0])); // 0xffff (ignores trailing bytes)
 * ```
 *
 * @see {@link padRightCodec}
 * @see {@link padRightEncoder}
 */
export function padRightDecoder<TDecoder extends AnyDecoder>(decoder: TDecoder, offset: Offset): TDecoder {
    return offsetDecoder(
        resizeDecoder(decoder, size => size + offset),
        { postOffset: ({ postOffset }) => postOffset + offset },
    );
}

/**
 * Adds left padding to the given codec, shifting the encoding and decoding positions
 * forward by `offset` bytes whilst increasing the size of the codec accordingly.
 *
 * This ensures that values are read and written at a later position in the byte array,
 * while the padding bytes remain unused.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 *
 * @param codec - The codec to pad.
 * @param offset - The number of padding bytes to add before encoding and decoding.
 * @returns A new codec with left padding applied.
 *
 * @example
 * ```ts
 * const codec = padLeftCodec(getU16Codec(), 2);
 * const bytes = codec.encode(0xffff); // 0x0000ffff (0xffff written at offset 2)
 * const value = codec.decode(bytes);  // 0xffff (reads from offset 2)
 * ```
 *
 * @remarks
 * If you only need to apply padding for encoding, use {@link padLeftEncoder}.
 * If you only need to apply padding for decoding, use {@link padLeftDecoder}.
 *
 * ```ts
 * const bytes = padLeftEncoder(getU16Encoder(), 2).encode(0xffff);
 * const value = padLeftDecoder(getU16Decoder(), 2).decode(bytes);
 * ```
 *
 * @see {@link padLeftEncoder}
 * @see {@link padLeftDecoder}
 */
export function padLeftCodec<TCodec extends AnyCodec>(codec: TCodec, offset: Offset): TCodec {
    return combineCodec(padLeftEncoder(codec, offset), padLeftDecoder(codec, offset)) as TCodec;
}

/**
 * Adds right padding to the given codec, extending the encoded and decoded value
 * by `offset` bytes whilst increasing the size of the codec accordingly.
 *
 * The extra bytes remain unused, ensuring that the next operation starts further
 * along the byte array.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 *
 * @param codec - The codec to pad.
 * @param offset - The number of padding bytes to add after encoding and decoding.
 * @returns A new codec with right padding applied.
 *
 * @example
 * ```ts
 * const codec = padRightCodec(getU16Codec(), 2);
 * const bytes = codec.encode(0xffff); // 0xffff0000 (two extra bytes added)
 * const value = codec.decode(bytes);  // 0xffff (ignores padding bytes)
 * ```
 *
 * @remarks
 * If you only need to apply padding for encoding, use {@link padRightEncoder}.
 * If you only need to apply padding for decoding, use {@link padRightDecoder}.
 *
 * ```ts
 * const bytes = padRightEncoder(getU16Encoder(), 2).encode(0xffff);
 * const value = padRightDecoder(getU16Decoder(), 2).decode(bytes);
 * ```
 *
 * @see {@link padRightEncoder}
 * @see {@link padRightDecoder}
 */
export function padRightCodec<TCodec extends AnyCodec>(codec: TCodec, offset: Offset): TCodec {
    return combineCodec(padRightEncoder(codec, offset), padRightDecoder(codec, offset)) as TCodec;
}
