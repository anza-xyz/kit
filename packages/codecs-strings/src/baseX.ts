import {
    combineCodec,
    createDecoder,
    createEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import { assertValidBaseString } from './assertions';

/**
 * Returns an encoder for base-X encoded strings.
 *
 * This encoder serializes strings using a custom alphabet, treating the length of the alphabet as the base.
 * The encoding process involves converting the input string to a numeric value in base-X, then
 * encoding that value into bytes while preserving leading zeroes.
 *
 * For more details, see {@link getBaseXCodec}.
 *
 * @param alphabet - The set of characters defining the base-X encoding.
 * @returns A `VariableSizeEncoder<string>` for encoding base-X strings.
 *
 * @example
 * Encoding a base-X string using a custom alphabet.
 * ```ts
 * const encoder = getBaseXEncoder('0123456789abcdef');
 * const bytes = encoder.encode('deadface'); // 0xdeadface
 * ```
 *
 * @see {@link getBaseXCodec}
 */
export const getBaseXEncoder = (alphabet: string): VariableSizeEncoder<string> => {
    return createEncoder({
        getSizeFromValue: (value: string): number => {
            const [leadingZeroes, tailChars] = partitionLeadingZeroes(value, alphabet[0]);
            if (!tailChars) return value.length;

            const base10Number = getBigIntFromBaseX(tailChars, alphabet);
            return leadingZeroes.length + Math.ceil(base10Number.toString(16).length / 2);
        },
        write(value: string, bytes, offset) {
            // Check if the value is valid.
            assertValidBaseString(alphabet, value);
            if (value === '') return offset;

            // Handle leading zeroes.
            const [leadingZeroes, tailChars] = partitionLeadingZeroes(value, alphabet[0]);
            if (!tailChars) {
                bytes.set(new Uint8Array(leadingZeroes.length).fill(0), offset);
                return offset + leadingZeroes.length;
            }

            // From baseX to base10.
            let base10Number = getBigIntFromBaseX(tailChars, alphabet);

            // From base10 to bytes.
            const tailBytes: number[] = [];
            while (base10Number > 0n) {
                tailBytes.unshift(Number(base10Number % 256n));
                base10Number /= 256n;
            }

            const bytesToAdd = [...Array(leadingZeroes.length).fill(0), ...tailBytes];
            bytes.set(bytesToAdd, offset);
            return offset + bytesToAdd.length;
        },
    });
};

/**
 * Returns a decoder for base-X encoded strings.
 *
 * This decoder deserializes base-X encoded strings from a byte array using a custom alphabet.
 * The decoding process converts the byte array into a numeric value in base-10, then
 * maps that value back to characters in the specified base-X alphabet.
 *
 * For more details, see {@link getBaseXCodec}.
 *
 * @param alphabet - The set of characters defining the base-X encoding.
 * @returns A `VariableSizeDecoder<string>` for decoding base-X strings.
 *
 * @example
 * Decoding a base-X string using a custom alphabet.
 * ```ts
 * const decoder = getBaseXDecoder('0123456789abcdef');
 * const value = decoder.decode(new Uint8Array([0xde, 0xad, 0xfa, 0xce])); // "deadface"
 * ```
 *
 * @see {@link getBaseXCodec}
 */
export const getBaseXDecoder = (alphabet: string): VariableSizeDecoder<string> => {
    return createDecoder({
        read(rawBytes, offset): [string, number] {
            const bytes = offset === 0 ? rawBytes : rawBytes.slice(offset);
            if (bytes.length === 0) return ['', 0];

            // Handle leading zeroes.
            let trailIndex = bytes.findIndex(n => n !== 0);
            trailIndex = trailIndex === -1 ? bytes.length : trailIndex;
            const leadingZeroes = alphabet[0].repeat(trailIndex);
            if (trailIndex === bytes.length) return [leadingZeroes, rawBytes.length];

            // From bytes to base10.
            const base10Number = bytes.slice(trailIndex).reduce((sum, byte) => sum * 256n + BigInt(byte), 0n);

            // From base10 to baseX.
            const tailChars = getBaseXFromBigInt(base10Number, alphabet);

            return [leadingZeroes + tailChars, rawBytes.length];
        },
    });
};

/**
 * Returns a codec for encoding and decoding base-X strings.
 *
 * This codec serializes strings using a custom alphabet, treating the length of the alphabet as the base.
 * The encoding process converts the input string into a numeric value in base-X, which is then encoded as bytes.
 * The decoding process reverses this transformation to reconstruct the original string.
 *
 * This codec supports leading zeroes by treating the first character of the alphabet as the zero character.
 *
 * @param alphabet - The set of characters defining the base-X encoding.
 * @returns A `VariableSizeCodec<string>` for encoding and decoding base-X strings.
 *
 * @example
 * Encoding and decoding a base-X string using a custom alphabet.
 * ```ts
 * const codec = getBaseXCodec('0123456789abcdef');
 * const bytes = codec.encode('deadface'); // 0xdeadface
 * const value = codec.decode(bytes);      // "deadface"
 * ```
 *
 * @remarks
 * This codec does not enforce a size boundary. It will encode and decode all bytes necessary to represent the string.
 *
 * If you need a fixed-size base-X codec, consider using {@link fixCodecSize}.
 *
 * ```ts
 * const codec = fixCodecSize(getBaseXCodec('0123456789abcdef'), 8);
 * ```
 *
 * If you need a size-prefixed base-X codec, consider using {@link addCodecSizePrefix}.
 *
 * ```ts
 * const codec = addCodecSizePrefix(getBaseXCodec('0123456789abcdef'), getU32Codec());
 * ```
 *
 * Separate {@link getBaseXEncoder} and {@link getBaseXDecoder} functions are available.
 *
 * ```ts
 * const bytes = getBaseXEncoder('0123456789abcdef').encode('deadface');
 * const value = getBaseXDecoder('0123456789abcdef').decode(bytes);
 * ```
 *
 * @see {@link getBaseXEncoder}
 * @see {@link getBaseXDecoder}
 */
export const getBaseXCodec = (alphabet: string): VariableSizeCodec<string> =>
    combineCodec(getBaseXEncoder(alphabet), getBaseXDecoder(alphabet));

function partitionLeadingZeroes(
    value: string,
    zeroCharacter: string,
): [leadingZeros: string, tailChars: string | undefined] {
    const [leadingZeros, tailChars] = value.split(new RegExp(`((?!${zeroCharacter}).*)`));
    return [leadingZeros, tailChars];
}

function getBigIntFromBaseX(value: string, alphabet: string): bigint {
    const base = BigInt(alphabet.length);
    let sum = 0n;
    for (const char of value) {
        sum *= base;
        sum += BigInt(alphabet.indexOf(char));
    }
    return sum;
}

function getBaseXFromBigInt(value: bigint, alphabet: string): string {
    const base = BigInt(alphabet.length);
    const tailChars = [];
    while (value > 0n) {
        tailChars.unshift(alphabet[Number(value % base)]);
        value /= base;
    }
    return tailChars.join('');
}
