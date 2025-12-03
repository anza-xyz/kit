import { SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH, SolanaError } from '@solana/errors';

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
} from './codec';
import { combineCodec } from './combine-codec';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEncoder = Encoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDecoder = Decoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCodec = Codec<any>;

/**
 * Updates the size of a given encoder.
 *
 * This function modifies the size of an encoder using a provided transformation function.
 * For fixed-size encoders, it updates the `fixedSize` property, and for variable-size
 * encoders, it adjusts the size calculation based on the encoded value.
 *
 * If the new size is negative, an error will be thrown.
 *
 * For more details, see {@link resizeCodec}.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TSize - The original fixed size of the encoded value.
 * @typeParam TNewSize - The new fixed size after resizing.
 *
 * @param encoder - The encoder whose size will be updated.
 * @param resize - A function that takes the current size and returns the new size.
 * @returns A new encoder with the updated size.
 *
 * @example
 * Increasing the size of a `u16` encoder by 2 bytes.
 * ```ts
 * const encoder = resizeEncoder(getU16Encoder(), size => size + 2);
 * encoder.encode(0xffff); // 0xffff0000 (two extra bytes added)
 * ```
 *
 * @example
 * Shrinking a `u32` encoder to only use 2 bytes.
 * ```ts
 * const encoder = resizeEncoder(getU32Encoder(), () => 2);
 * encoder.fixedSize; // 2
 * ```
 *
 * @see {@link resizeCodec}
 * @see {@link resizeDecoder}
 */
export function resizeEncoder<TFrom, TSize extends number, TNewSize extends number>(
    encoder: FixedSizeEncoder<TFrom, TSize>,
    resize: (size: TSize) => TNewSize,
): FixedSizeEncoder<TFrom, TNewSize>;
export function resizeEncoder<TEncoder extends AnyEncoder>(
    encoder: TEncoder,
    resize: (size: number) => number,
): TEncoder;
export function resizeEncoder<TEncoder extends AnyEncoder>(
    encoder: TEncoder,
    resize: (size: number) => number,
): TEncoder {
    if (isFixedSize(encoder)) {
        const fixedSize = resize(encoder.fixedSize);
        if (fixedSize < 0) {
            throw new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH, {
                bytesLength: fixedSize,
                codecDescription: 'resizeEncoder',
            });
        }
        return createEncoder({ ...encoder, fixedSize }) as TEncoder;
    }
    return createEncoder({
        ...encoder,
        getSizeFromValue: value => {
            const newSize = resize(encoder.getSizeFromValue(value));
            if (newSize < 0) {
                throw new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH, {
                    bytesLength: newSize,
                    codecDescription: 'resizeEncoder',
                });
            }
            return newSize;
        },
    }) as TEncoder;
}

/**
 * Updates the size of a given decoder.
 *
 * This function modifies the size of a decoder using a provided transformation function.
 * For fixed-size decoders, it updates the `fixedSize` property to reflect the new size.
 * Variable-size decoders remain unchanged, as their size is determined dynamically.
 *
 * If the new size is negative, an error will be thrown.
 *
 * For more details, see {@link resizeCodec}.
 *
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The original fixed size of the decoded value.
 * @typeParam TNewSize - The new fixed size after resizing.
 *
 * @param decoder - The decoder whose size will be updated.
 * @param resize - A function that takes the current size and returns the new size.
 * @returns A new decoder with the updated size.
 *
 * @example
 * Expanding a `u16` decoder to read 4 bytes instead of 2.
 * ```ts
 * const decoder = resizeDecoder(getU16Decoder(), size => size + 2);
 * decoder.fixedSize; // 4
 * ```
 *
 * @example
 * Shrinking a `u32` decoder to only read 2 bytes.
 * ```ts
 * const decoder = resizeDecoder(getU32Decoder(), () => 2);
 * decoder.fixedSize; // 2
 * ```
 *
 * @see {@link resizeCodec}
 * @see {@link resizeEncoder}
 */
export function resizeDecoder<TFrom, TSize extends number, TNewSize extends number>(
    decoder: FixedSizeDecoder<TFrom, TSize>,
    resize: (size: TSize) => TNewSize,
): FixedSizeDecoder<TFrom, TNewSize>;
export function resizeDecoder<TDecoder extends AnyDecoder>(
    decoder: TDecoder,
    resize: (size: number) => number,
): TDecoder;
export function resizeDecoder<TDecoder extends AnyDecoder>(
    decoder: TDecoder,
    resize: (size: number) => number,
): TDecoder {
    if (isFixedSize(decoder)) {
        const fixedSize = resize(decoder.fixedSize);
        if (fixedSize < 0) {
            throw new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH, {
                bytesLength: fixedSize,
                codecDescription: 'resizeDecoder',
            });
        }
        return createDecoder({ ...decoder, fixedSize }) as TDecoder;
    }
    return decoder;
}

/**
 * Updates the size of a given codec.
 *
 * This function modifies the size of both the codec using a provided
 * transformation function. It is useful for adjusting the allocated byte size for
 * encoding and decoding without altering the underlying data structure.
 *
 * If the new size is negative, an error will be thrown.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The original fixed size of the encoded/decoded value (for fixed-size codecs).
 * @typeParam TNewSize - The new fixed size after resizing (for fixed-size codecs).
 *
 * @param codec - The codec whose size will be updated.
 * @param resize - A function that takes the current size and returns the new size.
 * @returns A new codec with the updated size.
 *
 * @example
 * Expanding a `u16` codec from 2 to 4 bytes.
 * ```ts
 * const codec = resizeCodec(getU16Codec(), size => size + 2);
 * const bytes = codec.encode(0xffff); // 0xffff0000 (two extra bytes added)
 * const value = codec.decode(bytes);  // 0xffff (reads original two bytes)
 * ```
 *
 * @example
 * Shrinking a `u32` codec to only use 2 bytes.
 * ```ts
 * const codec = resizeCodec(getU32Codec(), () => 2);
 * codec.fixedSize; // 2
 * ```
 *
 * @remarks
 * If you only need to resize an encoder, use {@link resizeEncoder}.
 * If you only need to resize a decoder, use {@link resizeDecoder}.
 *
 * ```ts
 * const bytes = resizeEncoder(getU32Encoder(), (size) => size + 2).encode(0xffff);
 * const value = resizeDecoder(getU32Decoder(), (size) => size + 2).decode(bytes);
 * ```
 *
 * @see {@link resizeEncoder}
 * @see {@link resizeDecoder}
 */
export function resizeCodec<TFrom, TTo extends TFrom, TSize extends number, TNewSize extends number>(
    codec: FixedSizeCodec<TFrom, TTo, TSize>,
    resize: (size: TSize) => TNewSize,
): FixedSizeCodec<TFrom, TTo, TNewSize>;
export function resizeCodec<TCodec extends AnyCodec>(codec: TCodec, resize: (size: number) => number): TCodec;
export function resizeCodec<TCodec extends AnyCodec>(codec: TCodec, resize: (size: number) => number): TCodec {
    return combineCodec(resizeEncoder(codec, resize), resizeDecoder(codec, resize)) as TCodec;
}
