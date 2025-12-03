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
 * Returns an encoder for base-X encoded strings using bit re-slicing.
 *
 * This encoder serializes strings by dividing the input into custom-sized bit chunks,
 * mapping them to an alphabet, and encoding the result into a byte array.
 * This approach is commonly used for encoding schemes where the alphabet's length is a power of 2,
 * such as base-16 or base-64.
 *
 * For more details, see {@link getBaseXResliceCodec}.
 *
 * @param alphabet - The set of characters defining the base-X encoding.
 * @param bits - The number of bits per encoded chunk, typically `log2(alphabet.length)`.
 * @returns A `VariableSizeEncoder<string>` for encoding base-X strings using bit re-slicing.
 *
 * @example
 * Encoding a base-X string using bit re-slicing.
 * ```ts
 * const encoder = getBaseXResliceEncoder('elho', 2);
 * const bytes = encoder.encode('hellolol'); // 0x4aee
 * ```
 *
 * @see {@link getBaseXResliceCodec}
 */
export const getBaseXResliceEncoder = (alphabet: string, bits: number): VariableSizeEncoder<string> =>
    createEncoder({
        getSizeFromValue: (value: string) => Math.floor((value.length * bits) / 8),
        write(value: string, bytes, offset) {
            assertValidBaseString(alphabet, value);
            if (value === '') return offset;
            const charIndices = [...value].map(c => alphabet.indexOf(c));
            const reslicedBytes = reslice(charIndices, bits, 8, false);
            bytes.set(reslicedBytes, offset);
            return reslicedBytes.length + offset;
        },
    });

/**
 * Returns a decoder for base-X encoded strings using bit re-slicing.
 *
 * This decoder deserializes base-X encoded strings by re-slicing the bits of a byte array into
 * custom-sized chunks and mapping them to a specified alphabet.
 * This is typically used for encoding schemes where the alphabet's length is a power of 2,
 * such as base-16 or base-64.
 *
 * For more details, see {@link getBaseXResliceCodec}.
 *
 * @param alphabet - The set of characters defining the base-X encoding.
 * @param bits - The number of bits per encoded chunk, typically `log2(alphabet.length)`.
 * @returns A `VariableSizeDecoder<string>` for decoding base-X strings using bit re-slicing.
 *
 * @example
 * Decoding a base-X string using bit re-slicing.
 * ```ts
 * const decoder = getBaseXResliceDecoder('elho', 2);
 * const value = decoder.decode(new Uint8Array([0x4a, 0xee])); // "hellolol"
 * ```
 *
 * @see {@link getBaseXResliceCodec}
 */
export const getBaseXResliceDecoder = (alphabet: string, bits: number): VariableSizeDecoder<string> =>
    createDecoder({
        read(rawBytes, offset = 0): [string, number] {
            const bytes = offset === 0 ? rawBytes : rawBytes.slice(offset);
            if (bytes.length === 0) return ['', rawBytes.length];
            const charIndices = reslice([...bytes], 8, bits, true);
            return [charIndices.map(i => alphabet[i]).join(''), rawBytes.length];
        },
    });

/**
 * Returns a codec for encoding and decoding base-X strings using bit re-slicing.
 *
 * This codec serializes strings by dividing the input into custom-sized bit chunks,
 * mapping them to a given alphabet, and encoding the result into bytes.
 * It is particularly suited for encoding schemes where the alphabet's length is a power of 2,
 * such as base-16 or base-64.
 *
 * @param alphabet - The set of characters defining the base-X encoding.
 * @param bits - The number of bits per encoded chunk, typically `log2(alphabet.length)`.
 * @returns A `VariableSizeCodec<string>` for encoding and decoding base-X strings using bit re-slicing.
 *
 * @example
 * Encoding and decoding a base-X string using bit re-slicing.
 * ```ts
 * const codec = getBaseXResliceCodec('elho', 2);
 * const bytes = codec.encode('hellolol'); // 0x4aee
 * const value = codec.decode(bytes);      // "hellolol"
 * ```
 *
 * @remarks
 * This codec does not enforce a size boundary. It will encode and decode all bytes necessary to represent the string.
 *
 * If you need a fixed-size base-X codec, consider using {@link fixCodecSize}.
 *
 * ```ts
 * const codec = fixCodecSize(getBaseXResliceCodec('elho', 2), 8);
 * ```
 *
 * If you need a size-prefixed base-X codec, consider using {@link addCodecSizePrefix}.
 *
 * ```ts
 * const codec = addCodecSizePrefix(getBaseXResliceCodec('elho', 2), getU32Codec());
 * ```
 *
 * Separate {@link getBaseXResliceEncoder} and {@link getBaseXResliceDecoder} functions are available.
 *
 * ```ts
 * const bytes = getBaseXResliceEncoder('elho', 2).encode('hellolol');
 * const value = getBaseXResliceDecoder('elho', 2).decode(bytes);
 * ```
 *
 * @see {@link getBaseXResliceEncoder}
 * @see {@link getBaseXResliceDecoder}
 */
export const getBaseXResliceCodec = (alphabet: string, bits: number): VariableSizeCodec<string> =>
    combineCodec(getBaseXResliceEncoder(alphabet, bits), getBaseXResliceDecoder(alphabet, bits));

/** Helper function to reslice the bits inside bytes. */
function reslice(input: number[], inputBits: number, outputBits: number, useRemainder: boolean): number[] {
    const output = [];
    let accumulator = 0;
    let bitsInAccumulator = 0;
    const mask = (1 << outputBits) - 1;
    for (const value of input) {
        accumulator = (accumulator << inputBits) | value;
        bitsInAccumulator += inputBits;
        while (bitsInAccumulator >= outputBits) {
            bitsInAccumulator -= outputBits;
            output.push((accumulator >> bitsInAccumulator) & mask);
        }
    }
    if (useRemainder && bitsInAccumulator > 0) {
        output.push((accumulator << (outputBits - bitsInAccumulator)) & mask);
    }
    return output;
}
