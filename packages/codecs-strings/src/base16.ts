import {
    combineCodec,
    createDecoder,
    createEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, SolanaError } from '@solana/errors';

const enum HexC {
    ZERO = 48, // 0
    NINE = 57, // 9
    A_UP = 65, // A
    F_UP = 70, // F
    A_LO = 97, // a
    F_LO = 102, // f
}

const INVALID_STRING_ERROR_BASE_CONFIG = {
    alphabet: '0123456789abcdef',
    base: 16,
} as const;

function charCodeToBase16(char: number) {
    if (char >= HexC.ZERO && char <= HexC.NINE) return char - HexC.ZERO;
    if (char >= HexC.A_UP && char <= HexC.F_UP) return char - (HexC.A_UP - 10);
    if (char >= HexC.A_LO && char <= HexC.F_LO) return char - (HexC.A_LO - 10);
}

/**
 * Returns an encoder for base-16 (hexadecimal) strings.
 *
 * This encoder serializes strings using a base-16 encoding scheme.
 * The output consists of bytes representing the hexadecimal values of the input string.
 *
 * For more details, see {@link getBase16Codec}.
 *
 * @returns A `VariableSizeEncoder<string>` for encoding base-16 strings.
 *
 * @example
 * Encoding a base-16 string.
 * ```ts
 * const encoder = getBase16Encoder();
 * const bytes = encoder.encode('deadface'); // 0xdeadface
 * ```
 *
 * @see {@link getBase16Codec}
 */
export const getBase16Encoder = (): VariableSizeEncoder<string> =>
    createEncoder({
        getSizeFromValue: (value: string) => Math.ceil(value.length / 2),
        write(value: string, bytes, offset) {
            const len = value.length;
            const al = len / 2;
            if (len === 1) {
                const c = value.charCodeAt(0);
                const n = charCodeToBase16(c);
                if (n === undefined) {
                    throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
                        ...INVALID_STRING_ERROR_BASE_CONFIG,
                        value,
                    });
                }
                bytes.set([n], offset);
                return 1 + offset;
            }
            const hexBytes = new Uint8Array(al);
            for (let i = 0, j = 0; i < al; i++) {
                const c1 = value.charCodeAt(j++);
                const c2 = value.charCodeAt(j++);

                const n1 = charCodeToBase16(c1);
                const n2 = charCodeToBase16(c2);
                if (n1 === undefined || (n2 === undefined && !Number.isNaN(c2))) {
                    throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
                        ...INVALID_STRING_ERROR_BASE_CONFIG,
                        value,
                    });
                }
                hexBytes[i] = !Number.isNaN(c2) ? (n1 << 4) | (n2 ?? 0) : n1;
            }

            bytes.set(hexBytes, offset);
            return hexBytes.length + offset;
        },
    });

/**
 * Returns a decoder for base-16 (hexadecimal) strings.
 *
 * This decoder deserializes base-16 encoded strings from a byte array.
 *
 * For more details, see {@link getBase16Codec}.
 *
 * @returns A `VariableSizeDecoder<string>` for decoding base-16 strings.
 *
 * @example
 * Decoding a base-16 string.
 * ```ts
 * const decoder = getBase16Decoder();
 * const value = decoder.decode(new Uint8Array([0xde, 0xad, 0xfa, 0xce])); // "deadface"
 * ```
 *
 * @see {@link getBase16Codec}
 */
export const getBase16Decoder = (): VariableSizeDecoder<string> =>
    createDecoder({
        read(bytes, offset) {
            const value = bytes.slice(offset).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
            return [value, bytes.length];
        },
    });

/**
 * Returns a codec for encoding and decoding base-16 (hexadecimal) strings.
 *
 * This codec serializes strings using a base-16 encoding scheme.
 * The output consists of bytes representing the hexadecimal values of the input string.
 *
 * @returns A `VariableSizeCodec<string>` for encoding and decoding base-16 strings.
 *
 * @example
 * Encoding and decoding a base-16 string.
 * ```ts
 * const codec = getBase16Codec();
 * const bytes = codec.encode('deadface'); // 0xdeadface
 * const value = codec.decode(bytes);      // "deadface"
 * ```
 *
 * @remarks
 * This codec does not enforce a size boundary. It will encode and decode all bytes necessary to represent the string.
 *
 * If you need a fixed-size base-16 codec, consider using {@link fixCodecSize}.
 *
 * ```ts
 * const codec = fixCodecSize(getBase16Codec(), 8);
 * ```
 *
 * If you need a size-prefixed base-16 codec, consider using {@link addCodecSizePrefix}.
 *
 * ```ts
 * const codec = addCodecSizePrefix(getBase16Codec(), getU32Codec());
 * ```
 *
 * Separate {@link getBase16Encoder} and {@link getBase16Decoder} functions are available.
 *
 * ```ts
 * const bytes = getBase16Encoder().encode('deadface');
 * const value = getBase16Decoder().decode(bytes);
 * ```
 *
 * @see {@link getBase16Encoder}
 * @see {@link getBase16Decoder}
 */
export const getBase16Codec = (): VariableSizeCodec<string> => combineCodec(getBase16Encoder(), getBase16Decoder());
