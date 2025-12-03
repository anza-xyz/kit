import {
    combineCodec,
    containsBytes,
    createDecoder,
    createEncoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    ReadonlyUint8Array,
} from '@solana/codecs-core';
import { getBase16Decoder } from '@solana/codecs-strings';
import { SOLANA_ERROR__CODECS__INVALID_CONSTANT, SolanaError } from '@solana/errors';

/**
 * Returns an encoder that always writes a predefined constant byte sequence.
 *
 * This encoder ensures that encoding always produces the specified byte array,
 * ignoring any input values.
 *
 * For more details, see {@link getConstantCodec}.
 *
 * @typeParam TConstant - The fixed byte sequence that will be written during encoding.
 *
 * @param constant - The predefined byte array to encode.
 * @returns A `FixedSizeEncoder<void, N>` where `N` is the length of the constant.
 *
 * @example
 * Encoding a constant magic number.
 * ```ts
 * const encoder = getConstantEncoder(new Uint8Array([1, 2, 3, 4]));
 *
 * const bytes = encoder.encode();
 * // 0x01020304
 * //   └──────┘ The predefined 4-byte constant.
 * ```
 *
 * @see {@link getConstantCodec}
 */
export function getConstantEncoder<TConstant extends ReadonlyUint8Array>(
    constant: TConstant,
): FixedSizeEncoder<void, TConstant['length']> {
    return createEncoder({
        fixedSize: constant.length,
        write: (_, bytes, offset) => {
            bytes.set(constant, offset);
            return offset + constant.length;
        },
    });
}

/**
 * Returns a decoder that verifies a predefined constant byte sequence.
 *
 * This decoder reads the next bytes and checks that they match the provided constant.
 * If the bytes differ, it throws an error.
 *
 * For more details, see {@link getConstantCodec}.
 *
 * @typeParam TConstant - The fixed byte sequence expected during decoding.
 *
 * @param constant - The predefined byte array to verify.
 * @returns A `FixedSizeDecoder<void, N>` where `N` is the length of the constant.
 *
 * @example
 * Decoding a constant magic number.
 * ```ts
 * const decoder = getConstantDecoder(new Uint8Array([1, 2, 3]));
 *
 * decoder.decode(new Uint8Array([1, 2, 3])); // Passes
 * decoder.decode(new Uint8Array([1, 2, 4])); // Throws an error
 * ```
 *
 * @see {@link getConstantCodec}
 */
export function getConstantDecoder<TConstant extends ReadonlyUint8Array>(
    constant: TConstant,
): FixedSizeDecoder<void, TConstant['length']> {
    return createDecoder({
        fixedSize: constant.length,
        read: (bytes, offset) => {
            const base16 = getBase16Decoder();
            if (!containsBytes(bytes, constant, offset)) {
                throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_CONSTANT, {
                    constant,
                    data: bytes,
                    hexConstant: base16.decode(constant),
                    hexData: base16.decode(bytes),
                    offset,
                });
            }
            return [undefined, offset + constant.length];
        },
    });
}

/**
 * Returns a codec that encodes and decodes a predefined constant byte sequence.
 *
 * - **Encoding:** Always writes the specified byte array.
 * - **Decoding:** Asserts that the next bytes match the constant, throwing an error if they do not.
 *
 * This is useful for encoding fixed byte patterns required in a binary format or to use in
 * conjunction with other codecs such as {@link getHiddenPrefixCodec} or {@link getHiddenSuffixCodec}.
 *
 * @typeParam TConstant - The fixed byte sequence to encode and verify during decoding.
 *
 * @param constant - The predefined byte array to encode and assert during decoding.
 * @returns A `FixedSizeCodec<void, void, N>` where `N` is the length of the constant.
 *
 * @example
 * Encoding and decoding a constant magic number.
 * ```ts
 * const codec = getConstantCodec(new Uint8Array([1, 2, 3]));
 *
 * codec.encode(); // 0x010203
 * codec.decode(new Uint8Array([1, 2, 3])); // Passes
 * codec.decode(new Uint8Array([1, 2, 4])); // Throws an error
 * ```
 *
 * @remarks
 * Separate {@link getConstantEncoder} and {@link getConstantDecoder} functions are available.
 *
 * ```ts
 * const bytes = getConstantEncoder(new Uint8Array([1, 2, 3])).encode();
 * getConstantDecoder(new Uint8Array([1, 2, 3])).decode(bytes);
 * ```
 *
 * @see {@link getConstantEncoder}
 * @see {@link getConstantDecoder}
 */
export function getConstantCodec<TConstant extends ReadonlyUint8Array>(
    constant: TConstant,
): FixedSizeCodec<void, void, TConstant['length']> {
    return combineCodec(getConstantEncoder(constant), getConstantDecoder(constant));
}
