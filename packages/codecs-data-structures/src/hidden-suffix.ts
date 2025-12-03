import {
    Codec,
    combineCodec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import { getTupleDecoder, getTupleEncoder } from './tuple';

/**
 * Returns an encoder that appends hidden data after the encoded value.
 *
 * This encoder applies a list of void encoders after encoding the main value.
 * The suffixed data is encoded after the main value without being exposed to the user.
 *
 * For more details, see {@link getHiddenSuffixCodec}.
 *
 * @typeParam TFrom - The type of the main value being encoded.
 *
 * @param encoder - The encoder for the main value.
 * @param suffixedEncoders - A list of void encoders that produce the hidden suffix.
 * @returns A `FixedSizeEncoder` or `VariableSizeEncoder` that encodes the value with a hidden suffix.
 *
 * @example
 * Suffixing a value with constants.
 * ```ts
 * const encoder = getHiddenSuffixEncoder(getUtf8Encoder(), [
 *   getConstantCodec(new Uint8Array([1, 2, 3])),
 *   getConstantCodec(new Uint8Array([4, 5, 6])),
 * ]);
 *
 * encoder.encode('Hello');
 * // 0x48656c6c6f010203040506
 * //   |         |     └-- Our second hidden suffix.
 * //   |         └-- Our first hidden suffix.
 * //   └-- Our encoded value ("Hello").
 * ```
 *
 * @see {@link getHiddenSuffixCodec}
 */
export function getHiddenSuffixEncoder<TFrom>(
    encoder: FixedSizeEncoder<TFrom>,
    suffixedEncoders: readonly FixedSizeEncoder<void>[],
): FixedSizeEncoder<TFrom>;
export function getHiddenSuffixEncoder<TFrom>(
    encoder: Encoder<TFrom>,
    suffixedEncoders: readonly Encoder<void>[],
): VariableSizeEncoder<TFrom>;
export function getHiddenSuffixEncoder<TFrom>(
    encoder: Encoder<TFrom>,
    suffixedEncoders: readonly Encoder<void>[],
): Encoder<TFrom> {
    return transformEncoder(
        getTupleEncoder([encoder, ...suffixedEncoders]) as Encoder<readonly [TFrom, ...void[]]>,
        (value: TFrom) => [value, ...suffixedEncoders.map(() => undefined)] as const,
    );
}

/**
 * Returns a decoder that skips hidden suffixed data after decoding the main value.
 *
 * This decoder applies a list of void decoders after decoding the main value.
 * The suffixed data is skipped during decoding without being exposed to the user.
 *
 * For more details, see {@link getHiddenSuffixCodec}.
 *
 * @typeParam TTo - The type of the main value being decoded.
 *
 * @param decoder - The decoder for the main value.
 * @param suffixedDecoders - A list of void decoders that produce the hidden suffix.
 * @returns A `FixedSizeDecoder` or `VariableSizeDecoder` that decodes values while ignoring the hidden suffix.
 *
 * @example
 * Decoding a value with suffixed constants.
 * ```ts
 * const decoder = getHiddenSuffixDecoder(getUtf8Decoder(), [
 *   getConstantCodec(new Uint8Array([1, 2, 3])),
 *   getConstantCodec(new Uint8Array([4, 5, 6])),
 * ]);
 *
 * decoder.decode(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F, 1, 2, 3, 4, 5, 6]));
 * // 'Hello'
 * ```
 *
 * @see {@link getHiddenSuffixCodec}
 */
export function getHiddenSuffixDecoder<TTo>(
    decoder: FixedSizeDecoder<TTo>,
    suffixedDecoders: readonly FixedSizeDecoder<void>[],
): FixedSizeDecoder<TTo>;
export function getHiddenSuffixDecoder<TTo>(
    decoder: Decoder<TTo>,
    suffixedDecoders: readonly Decoder<void>[],
): VariableSizeDecoder<TTo>;
export function getHiddenSuffixDecoder<TTo>(
    decoder: Decoder<TTo>,
    suffixedDecoders: readonly Decoder<void>[],
): Decoder<TTo> {
    return transformDecoder(
        getTupleDecoder([decoder, ...suffixedDecoders]) as Decoder<readonly [TTo, ...void[]]>,
        tuple => tuple[0],
    );
}

/**
 * Returns a codec that encodes and decodes values with a hidden suffix.
 *
 * - **Encoding:** Appends hidden data after encoding the main value.
 * - **Decoding:** Skips the hidden suffix after decoding the main value.
 *
 * This is useful for any implicit metadata that should be present in
 * binary formats but omitted from the API.
 *
 * @typeParam TFrom - The type of the main value being encoded.
 * @typeParam TTo - The type of the main value being decoded.
 *
 * @param codec - The codec for the main value.
 * @param suffixedCodecs - A list of void codecs that produce the hidden suffix.
 * @returns A `FixedSizeCodec` or `VariableSizeCodec` for encoding and decoding values with a hidden suffix.
 *
 * @example
 * Encoding and decoding a value with suffixed constants.
 * ```ts
 * const codec = getHiddenSuffixCodec(getUtf8Codec(), [
 *   getConstantCodec(new Uint8Array([1, 2, 3])),
 *   getConstantCodec(new Uint8Array([4, 5, 6])),
 * ]);
 *
 * const bytes = codec.encode('Hello');
 * // 0x48656c6c6f010203040506
 * //   |         |     └-- Our second hidden suffix.
 * //   |         └-- Our first hidden suffix.
 * //   └-- Our encoded value ("Hello").
 *
 * codec.decode(bytes);
 * // 'Hello'
 * ```
 *
 * @remarks
 * If all you need is padding zeroes after a value, consider using {@link padRightCodec} instead.
 *
 * Separate {@link getHiddenSuffixEncoder} and {@link getHiddenSuffixDecoder} functions are available.
 *
 * ```ts
 * const bytes = getHiddenSuffixEncoder(getUtf8Encoder(), [
 *   getConstantEncoder(new Uint8Array([1, 2, 3])),
 *   getConstantEncoder(new Uint8Array([4, 5, 6])),
 * ]).encode('Hello');
 *
 * const value = getHiddenSuffixDecoder(getUtf8Decoder(), [
 *   getConstantDecoder(new Uint8Array([1, 2, 3])),
 *   getConstantDecoder(new Uint8Array([4, 5, 6])),
 * ]).decode(bytes);
 * ```
 *
 * @see {@link getHiddenSuffixEncoder}
 * @see {@link getHiddenSuffixDecoder}
 */
export function getHiddenSuffixCodec<TFrom, TTo extends TFrom>(
    codec: FixedSizeCodec<TFrom, TTo>,
    suffixedCodecs: readonly FixedSizeCodec<void>[],
): FixedSizeCodec<TFrom, TTo>;
export function getHiddenSuffixCodec<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
    suffixedCodecs: readonly Codec<void>[],
): VariableSizeCodec<TFrom, TTo>;
export function getHiddenSuffixCodec<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
    suffixedCodecs: readonly Codec<void>[],
): Codec<TFrom, TTo> {
    return combineCodec(getHiddenSuffixEncoder(codec, suffixedCodecs), getHiddenSuffixDecoder(codec, suffixedCodecs));
}
