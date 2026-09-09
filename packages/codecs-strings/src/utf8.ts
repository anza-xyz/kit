import {
    combineCodec,
    createDecoder,
    createEncoder,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES, SolanaError } from '@solana/errors';
import { TextDecoder, TextEncoder } from '@solana/text-encoding-impl';

import {
    assertIsWellFormedUtf8Bytes,
    assertIsWellFormedUtf8String,
    findMalformedUtf8SequenceOffset,
} from './assertions';
import { removeNullCharacters } from './null-characters';

/**
 * Defines the configuration options for UTF-8 codecs.
 */
export type Utf8CodecConfig = {
    /**
     * Whether to throw on invalid UTF-8 instead of silently substituting the replacement character (`U+FFFD`).
     *
     * When encoding, strings containing lone surrogates are rejected.
     * When decoding, malformed byte sequences are rejected.
     *
     * @defaultValue `false`
     */
    fatal?: boolean;
    /**
     * Whether to keep a leading byte order mark (`U+FEFF`) in decoded strings.
     *
     * By default, a leading byte order mark is stripped, as `TextDecoder` does.
     * Only applies when decoding.
     *
     * @defaultValue `false`
     */
    ignoreBOM?: boolean;
    /**
     * Whether to strip null characters (`\u0000`) from decoded strings.
     *
     * This is useful when decoding fixed-size strings that are padded with null characters,
     * but it makes the codec lossy for strings that legitimately contain null characters.
     * Only applies when decoding.
     *
     * @defaultValue `true`
     */
    removeNullCharacters?: boolean;
};

/**
 * Returns an encoder for UTF-8 strings.
 *
 * This encoder serializes strings using UTF-8 encoding.
 * The encoded output contains as many bytes as needed to represent the string.
 *
 * For more details, see {@link getUtf8Codec}.
 *
 * @param config - Optional configuration for the encoder. Only `fatal` applies when encoding.
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
export const getUtf8Encoder = (
    config: Omit<Utf8CodecConfig, 'ignoreBOM' | 'removeNullCharacters'> = {},
): VariableSizeEncoder<string> => {
    let textEncoder: TextEncoder;
    return createEncoder({
        getSizeFromValue: value => (textEncoder ||= new TextEncoder()).encode(value).length,
        write: (value: string, bytes, offset) => {
            if (config.fatal) {
                assertIsWellFormedUtf8String(value);
            }
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
 * @param config - Optional configuration for the decoder.
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
export const getUtf8Decoder = (config: Utf8CodecConfig = {}): VariableSizeDecoder<string> => {
    let textDecoder: TextDecoder;
    return createDecoder({
        read(bytes, offset) {
            textDecoder ||= new TextDecoder('utf-8', {
                fatal: config.fatal ?? false,
                ignoreBOM: config.ignoreBOM ?? false,
            });
            let value = config.fatal
                ? decodeFatal(textDecoder, bytes, offset)
                : textDecoder.decode(bytes.slice(offset));
            // Polyfills that ignore the `ignoreBOM` option do not reflect it
            // either, nor do they strip the byte order mark; do it ourselves.
            if (!config.ignoreBOM && textDecoder.ignoreBOM === undefined && value.charCodeAt(0) === 0xfeff) {
                value = value.slice(1);
            }
            if (config.removeNullCharacters !== false) {
                value = removeNullCharacters(value);
            }
            return [value, bytes.length];
        },
    });
};

/**
 * Decodes the given bytes, throwing a `SolanaError` on malformed UTF-8.
 *
 * Compliant `TextDecoder` implementations constructed with `fatal: true`
 * reject malformed input themselves, so validation is only needed when they
 * fail, to locate the malformed sequence for the error context. Polyfills
 * that ignore the `fatal` option do not reflect it on the `fatal` attribute
 * either, in which case the bytes are validated up front.
 */
function decodeFatal(textDecoder: TextDecoder, bytes: ReadonlyUint8Array | Uint8Array, offset: number): string {
    const slice = bytes.slice(offset);
    if (!textDecoder.fatal) {
        assertIsWellFormedUtf8Bytes(bytes, offset);
        return textDecoder.decode(slice);
    }
    try {
        return textDecoder.decode(slice);
    } catch {
        throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES, {
            bytes,
            offset: findMalformedUtf8SequenceOffset(bytes, offset),
        });
    }
}

/**
 * Returns a codec for encoding and decoding UTF-8 strings.
 *
 * This codec serializes strings using UTF-8 encoding.
 * The encoded output contains as many bytes as needed to represent the string.
 *
 * @param config - Optional configuration for the codec.
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
 * @example
 * Rejecting invalid UTF-8 instead of substituting the replacement character.
 * ```ts
 * const codec = getUtf8Codec({ fatal: true });
 * codec.encode('\ud800');                // Throws: lone surrogate.
 * codec.decode(new Uint8Array([0xff]));  // Throws: invalid byte sequence.
 * ```
 *
 * @example
 * Decoding losslessly, preserving null characters and a leading byte order mark.
 * ```ts
 * const codec = getUtf8Codec({ ignoreBOM: true, removeNullCharacters: false });
 * codec.decode(new Uint8Array([0x61, 0x00, 0x62]));       // "a\u0000b"
 * codec.decode(new Uint8Array([0xef, 0xbb, 0xbf, 0x61])); // "\ufeffa"
 * ```
 *
 * @remarks
 * By default, invalid UTF-8 is replaced with the replacement character (`U+FFFD`), a
 * leading byte order mark (`U+FEFF`) is stripped and null characters are stripped from
 * decoded strings, since they are commonly used as padding in fixed-size strings. Use the
 * `fatal`, `ignoreBOM` and `removeNullCharacters` options to change these behaviours. On
 * platforms whose `TextDecoder` does not implement the `fatal` option, the bytes are
 * validated by this package instead.
 *
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
export const getUtf8Codec = (config: Utf8CodecConfig = {}): VariableSizeCodec<string> =>
    combineCodec(getUtf8Encoder(config), getUtf8Decoder(config));
