import {
    combineCodec,
    createDecoder,
    createEncoder,
    toArrayBuffer,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, SolanaError } from '@solana/errors';

import { assertValidBaseString } from './assertions';
import { getBaseXResliceDecoder, getBaseXResliceEncoder } from './baseX-reslice';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const uint8ArrayFromBase64 = (Uint8Array as unknown as {
    fromBase64?: (value: string, options?: { alphabet?: 'base64' | 'base64url'; lastChunkHandling?: string }) => Uint8Array;
}).fromBase64;
const uint8ArrayToBase64 = (Uint8Array.prototype as unknown as {
    toBase64?: (options?: { alphabet?: 'base64' | 'base64url'; omitPadding?: boolean }) => string;
}).toBase64;

function getBase64Bytes(value: string, strictPadding: boolean): Uint8Array {
    if (uint8ArrayFromBase64) {
        if (strictPadding && value.length % 4 !== 0) {
            throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
                alphabet,
                base: 64,
                value,
            });
        }
        try {
            return uint8ArrayFromBase64(value, {
                alphabet: 'base64',
                lastChunkHandling: strictPadding ? 'strict' : 'loose',
            });
        } catch {
            if (__NODEJS__) {
                assertValidBaseString(alphabet, value.replace(/=/g, ''));
                return new Uint8Array(Buffer.from(value, 'base64'));
            }
            try {
                return uint8ArrayFromBase64(value);
            } catch {
                throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
                    alphabet,
                    base: 64,
                    value,
                });
            }
        }
    }

    if (__BROWSER__) {
        try {
            return Uint8Array.from((atob as Window['atob'])(value), c => c.charCodeAt(0));
        } catch {
            throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
                alphabet,
                base: 64,
                value,
            });
        }
    }

    if (__NODEJS__) {
        assertValidBaseString(alphabet, value.replace(/=/g, ''));
        return new Uint8Array(Buffer.from(value, 'base64'));
    }

    return new Uint8Array(getBaseXResliceEncoder(alphabet, 6).encode(value.replace(/=/g, '')));
}

function getBase64String(bytes: ReadonlyUint8Array): string {
    if (uint8ArrayToBase64) {
        return uint8ArrayToBase64.call(bytes);
    }

    if (__BROWSER__) {
        return (btoa as Window['btoa'])(String.fromCharCode(...bytes));
    }

    if (__NODEJS__) {
        return Buffer.from(toArrayBuffer(bytes)).toString('base64');
    }

    return getBaseXResliceDecoder(alphabet, 6)
        .decode(bytes)
        .padEnd(Math.ceil(bytes.length / 3) * 4, '=');
}

/**
 * Returns an encoder for base-64 strings.
 *
 * This encoder serializes strings using a base-64 encoding scheme,
 * commonly used for data encoding in URLs, cryptographic keys, and binary-to-text encoding.
 *
 * For more details, see {@link getBase64Codec}.
 *
 * @returns A `VariableSizeEncoder<string>` for encoding base-64 strings.
 *
 * @example
 * Encoding a base-64 string.
 * ```ts
 * const encoder = getBase64Encoder();
 * const bytes = encoder.encode('hello+world'); // 0x85e965a3ec28ae57
 * ```
 *
 * @see {@link getBase64Codec}
 */
export const getBase64Encoder = (): VariableSizeEncoder<string> => {
    const strictPadding = __BROWSER__;
    return createEncoder({
        getSizeFromValue: (value: string) => getBase64Bytes(value, strictPadding).length,
        write(value: string, bytes, offset) {
            const bytesToAdd = getBase64Bytes(value, strictPadding);
            bytes.set(bytesToAdd, offset);
            return bytesToAdd.length + offset;
        },
    });
};

/**
 * Returns a decoder for base-64 strings.
 *
 * This decoder deserializes base-64 encoded strings from a byte array.
 *
 * For more details, see {@link getBase64Codec}.
 *
 * @returns A `VariableSizeDecoder<string>` for decoding base-64 strings.
 *
 * @example
 * Decoding a base-64 string.
 * ```ts
 * const decoder = getBase64Decoder();
 * const value = decoder.decode(new Uint8Array([0x85, 0xe9, 0x65, 0xa3, 0xec, 0x28, 0xae, 0x57])); // "hello+world"
 * ```
 *
 * @see {@link getBase64Codec}
 */
export const getBase64Decoder = (): VariableSizeDecoder<string> => {
    return createDecoder({
        read(bytes, offset = 0) {
            const slice = bytes.slice(offset);
            const value = getBase64String(slice);
            return [value, bytes.length];
        },
    });
};

/**
 * Returns a codec for encoding and decoding base-64 strings.
 *
 * This codec serializes strings using a base-64 encoding scheme,
 * commonly used for data encoding in URLs, cryptographic keys, and binary-to-text encoding.
 *
 * @returns A `VariableSizeCodec<string>` for encoding and decoding base-64 strings.
 *
 * @example
 * Encoding and decoding a base-64 string.
 * ```ts
 * const codec = getBase64Codec();
 * const bytes = codec.encode('hello+world'); // 0x85e965a3ec28ae57
 * const value = codec.decode(bytes);         // "hello+world"
 * ```
 *
 * @remarks
 * This codec does not enforce a size boundary. It will encode and decode all bytes necessary to represent the string.
 *
 * If you need a fixed-size base-64 codec, consider using {@link fixCodecSize}.
 *
 * ```ts
 * const codec = fixCodecSize(getBase64Codec(), 8);
 * ```
 *
 * If you need a size-prefixed base-64 codec, consider using {@link addCodecSizePrefix}.
 *
 * ```ts
 * const codec = addCodecSizePrefix(getBase64Codec(), getU32Codec());
 * ```
 *
 * Separate {@link getBase64Encoder} and {@link getBase64Decoder} functions are available.
 *
 * ```ts
 * const bytes = getBase64Encoder().encode('hello+world');
 * const value = getBase64Decoder().decode(bytes);
 * ```
 *
 * @see {@link getBase64Encoder}
 * @see {@link getBase64Decoder}
 */
export const getBase64Codec = (): VariableSizeCodec<string> => combineCodec(getBase64Encoder(), getBase64Decoder());
