import {
    assertIsFixedSize,
    createDecoder,
    createEncoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
} from './codec';
import { combineCodec } from './combine-codec';
import { ReadonlyUint8Array } from './readonly-uint8array';

function copySourceToTargetInReverse(
    source: ReadonlyUint8Array,
    target_WILL_MUTATE: Uint8Array,
    sourceOffset: number,
    sourceLength: number,
    targetOffset: number = 0,
) {
    while (sourceOffset < --sourceLength) {
        const leftValue = source[sourceOffset];
        target_WILL_MUTATE[sourceOffset + targetOffset] = source[sourceLength];
        target_WILL_MUTATE[sourceLength + targetOffset] = leftValue;
        sourceOffset++;
    }
    if (sourceOffset === sourceLength) {
        target_WILL_MUTATE[sourceOffset + targetOffset] = source[sourceOffset];
    }
}

/**
 * Reverses the bytes of a fixed-size encoder.
 *
 * Given a `FixedSizeEncoder`, this function returns a new `FixedSizeEncoder` that
 * reverses the bytes within the fixed-size byte array when encoding.
 *
 * This can be useful to modify endianness or for other byte-order transformations.
 *
 * For more details, see {@link reverseCodec}.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 *
 * @param encoder - The fixed-size encoder to reverse.
 * @returns A new encoder that writes bytes in reverse order.
 *
 * @example
 * Encoding a `u16` value in reverse order.
 * ```ts
 * const encoder = reverseEncoder(getU16Encoder({ endian: Endian.Big }));
 * const bytes = encoder.encode(0x1234); // 0x3412 (bytes are flipped)
 * ```
 *
 * @see {@link reverseCodec}
 * @see {@link reverseDecoder}
 */
export function reverseEncoder<TFrom, TSize extends number>(
    encoder: FixedSizeEncoder<TFrom, TSize>,
): FixedSizeEncoder<TFrom, TSize> {
    assertIsFixedSize(encoder);
    return createEncoder({
        ...encoder,
        write: (value: TFrom, bytes, offset) => {
            const newOffset = encoder.write(value, bytes, offset);
            copySourceToTargetInReverse(
                bytes /* source */,
                bytes /* target_WILL_MUTATE */,
                offset /* sourceOffset */,
                offset + encoder.fixedSize /* sourceLength */,
            );
            return newOffset;
        },
    });
}

/**
 * Reverses the bytes of a fixed-size decoder.
 *
 * Given a `FixedSizeDecoder`, this function returns a new `FixedSizeDecoder` that
 * reverses the bytes within the fixed-size byte array before decoding.
 *
 * This can be useful to modify endianness or for other byte-order transformations.
 *
 * For more details, see {@link reverseCodec}.
 *
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the decoded value in bytes.
 *
 * @param decoder - The fixed-size decoder to reverse.
 * @returns A new decoder that reads bytes in reverse order.
 *
 * @example
 * Decoding a reversed `u16` value.
 * ```ts
 * const decoder = reverseDecoder(getU16Decoder({ endian: Endian.Big }));
 * const value = decoder.decode(new Uint8Array([0x34, 0x12])); // 0x1234 (bytes are flipped back)
 * ```
 *
 * @see {@link reverseCodec}
 * @see {@link reverseEncoder}
 */
export function reverseDecoder<TTo, TSize extends number>(
    decoder: FixedSizeDecoder<TTo, TSize>,
): FixedSizeDecoder<TTo, TSize> {
    assertIsFixedSize(decoder);
    return createDecoder({
        ...decoder,
        read: (bytes, offset) => {
            const reversedBytes = bytes.slice();
            copySourceToTargetInReverse(
                bytes /* source */,
                reversedBytes /* target_WILL_MUTATE */,
                offset /* sourceOffset */,
                offset + decoder.fixedSize /* sourceLength */,
            );
            return decoder.read(reversedBytes, offset);
        },
    });
}

/**
 * Reverses the bytes of a fixed-size codec.
 *
 * Given a `FixedSizeCodec`, this function returns a new `FixedSizeCodec` that
 * reverses the bytes within the fixed-size byte array during encoding and decoding.
 *
 * This can be useful to modify endianness or for other byte-order transformations.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded/decoded value in bytes.
 *
 * @param codec - The fixed-size codec to reverse.
 * @returns A new codec that encodes and decodes bytes in reverse order.
 *
 * @example
 * Reversing a `u16` codec.
 * ```ts
 * const codec = reverseCodec(getU16Codec({ endian: Endian.Big }));
 * const bytes = codec.encode(0x1234); // 0x3412 (bytes are flipped)
 * const value = codec.decode(bytes);  // 0x1234 (bytes are flipped back)
 * ```
 *
 * @remarks
 * If you only need to reverse an encoder, use {@link reverseEncoder}.
 * If you only need to reverse a decoder, use {@link reverseDecoder}.
 *
 * ```ts
 * const bytes = reverseEncoder(getU16Encoder()).encode(0x1234);
 * const value = reverseDecoder(getU16Decoder()).decode(bytes);
 * ```
 *
 * @see {@link reverseEncoder}
 * @see {@link reverseDecoder}
 */
export function reverseCodec<TFrom, TTo extends TFrom, TSize extends number>(
    codec: FixedSizeCodec<TFrom, TTo, TSize>,
): FixedSizeCodec<TFrom, TTo, TSize> {
    return combineCodec(reverseEncoder(codec), reverseDecoder(codec));
}
