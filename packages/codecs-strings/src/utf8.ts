import {
    combineCodec,
    createDecoder,
    createEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { TextDecoder, TextEncoder } from '@solana/text-encoding-impl';

import { removeNullCharacters } from './null-characters';

/**
 * Returns an encoder for UTF-8 strings.
 *
 * This encoder serializes strings using UTF-8 encoding.
 * The encoded output contains as many bytes as needed to represent the string.
 *
 * For more details, see {@link getUtf8Codec}.
 *
 * @returns A `VariableSizeEncoder<string>` for encoding UTF-8 strings.
 *
 * @example
 * Encoding a UTF-8 string.
 * ```ts
 * const encoder = getUtf8Encoder();
 * const bytes = encoder.encode('hello'); // 0x68656c6c6f
 * ```
 *
 * @see {@link getUtf8Codec}
 */
export const getUtf8Encoder = (): VariableSizeEncoder<string> => {
    let textEncoder: TextEncoder;
    return createEncoder({
        getSizeFromValue: value => (textEncoder ||= new TextEncoder()).encode(value).length,
        write: (value: string, bytes, offset) => {
            const bytesToAdd = (textEncoder ||= new TextEncoder()).encode(value);
            bytes.set(bytesToAdd, offset);
            return offset + bytesToAdd.length;
        },
    });
};

/**
 * Returns a decoder for UTF-8 strings.
 *
 * This decoder deserializes UTF-8 encoded strings from a byte array.
 * It reads all available bytes starting from the given offset.
 *
 * For more details, see {@link getUtf8Codec}.
 *
 * @returns A `VariableSizeDecoder<string>` for decoding UTF-8 strings.
 *
 * @example
 * Decoding a UTF-8 string.
 * ```ts
 * const decoder = getUtf8Decoder();
 * const value = decoder.decode(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])); // "hello"
 * ```
 *
 * @see {@link getUtf8Codec}
 */
export const getUtf8Decoder = (): VariableSizeDecoder<string> => {
    let textDecoder: TextDecoder;
    return createDecoder({
        read(bytes, offset) {
            const value = (textDecoder ||= new TextDecoder()).decode(bytes.slice(offset));
            return [removeNullCharacters(value), bytes.length];
        },
    });
};

/**
 * Returns a codec for encoding and decoding UTF-8 strings.
 *
 * This codec serializes strings using UTF-8 encoding.
 * The encoded output contains as many bytes as needed to represent the string.
 *
 * @returns A `VariableSizeCodec<string>` for encoding and decoding UTF-8 strings.
 *
 * @example
 * Encoding and decoding a UTF-8 string.
 * ```ts
 * const codec = getUtf8Codec();
 * const bytes = codec.encode('hello'); // 0x68656c6c6f
 * const value = codec.decode(bytes);   // "hello"
 * ```
 *
 * @remarks
 * This codec does not enforce a size boundary. It will encode and decode all bytes necessary to represent the string.
 *
 * If you need a fixed-size UTF-8 codec, consider using {@link fixCodecSize}.
 *
 * ```ts
 * const codec = fixCodecSize(getUtf8Codec(), 5);
 * ```
 *
 * If you need a size-prefixed UTF-8 codec, consider using {@link addCodecSizePrefix}.
 *
 * ```ts
 * const codec = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
 * ```
 *
 * Separate {@link getUtf8Encoder} and {@link getUtf8Decoder} functions are available.
 *
 * ```ts
 * const bytes = getUtf8Encoder().encode('hello');
 * const value = getUtf8Decoder().decode(bytes);
 * ```
 *
 * @see {@link getUtf8Encoder}
 * @see {@link getUtf8Decoder}
 */
export const getUtf8Codec = (): VariableSizeCodec<string> => combineCodec(getUtf8Encoder(), getUtf8Decoder());
