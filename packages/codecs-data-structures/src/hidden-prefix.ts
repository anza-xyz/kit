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
 * Returns an encoder that prefixes encoded values with hidden data.
 *
 * This encoder applies a list of void encoders before encoding the main value.
 * The prefixed data is encoded before the main value without being exposed to the user.
 *
 * For more details, see {@link getHiddenPrefixCodec}.
 *
 * @typeParam TFrom - The type of the main value being encoded.
 *
 * @param encoder - The encoder for the main value.
 * @param prefixedEncoders - A list of void encoders that produce the hidden prefix.
 * @returns A `FixedSizeEncoder` or `VariableSizeEncoder` that encodes the value with a hidden prefix.
 *
 * @example
 * Prefixing a value with constants.
 * ```ts
 * const encoder = getHiddenPrefixEncoder(getUtf8Encoder(), [
 *   getConstantCodec(new Uint8Array([1, 2, 3])),
 *   getConstantCodec(new Uint8Array([4, 5, 6])),
 * ]);
 *
 * encoder.encode('Hello');
 * // 0x01020304050648656c6c6f
 * //   |     |     └-- Our encoded value ("Hello").
 * //   |     └-- Our second hidden prefix.
 * //   └-- Our first hidden prefix.
 * ```
 *
 * @see {@link getHiddenPrefixCodec}
 */
export function getHiddenPrefixEncoder<TFrom>(
    encoder: FixedSizeEncoder<TFrom>,
    prefixedEncoders: readonly FixedSizeEncoder<void>[],
): FixedSizeEncoder<TFrom>;
export function getHiddenPrefixEncoder<TFrom>(
    encoder: Encoder<TFrom>,
    prefixedEncoders: readonly Encoder<void>[],
): VariableSizeEncoder<TFrom>;
export function getHiddenPrefixEncoder<TFrom>(
    encoder: Encoder<TFrom>,
    prefixedEncoders: readonly Encoder<void>[],
): Encoder<TFrom> {
    return transformEncoder(
        getTupleEncoder([...prefixedEncoders, encoder]) as Encoder<readonly [...void[], TFrom]>,
        (value: TFrom) => [...prefixedEncoders.map(() => undefined), value] as const,
    );
}

/**
 * Returns a decoder that skips hidden prefixed data before decoding the main value.
 *
 * This decoder applies a list of void decoders before decoding the main value.
 * The prefixed data is skipped during decoding without being exposed to the user.
 *
 * For more details, see {@link getHiddenPrefixCodec}.
 *
 * @typeParam TTo - The type of the main value being decoded.
 *
 * @param decoder - The decoder for the main value.
 * @param prefixedDecoders - A list of void decoders that produce the hidden prefix.
 * @returns A `FixedSizeDecoder` or `VariableSizeDecoder` that decodes values while ignoring the hidden prefix.
 *
 * @example
 * Decoding a value with prefixed constants.
 * ```ts
 * const decoder = getHiddenPrefixDecoder(getUtf8Decoder(), [
 *   getConstantCodec(new Uint8Array([1, 2, 3])),
 *   getConstantCodec(new Uint8Array([4, 5, 6])),
 * ]);
 *
 * decoder.decode(new Uint8Array([1, 2, 3, 4, 5, 6, 0x48, 0x65, 0x6C, 0x6C, 0x6F]));
 * // 'Hello'
 * ```
 *
 * @see {@link getHiddenPrefixCodec}
 */
export function getHiddenPrefixDecoder<TTo>(
    decoder: FixedSizeDecoder<TTo>,
    prefixedDecoders: readonly FixedSizeDecoder<void>[],
): FixedSizeDecoder<TTo>;
export function getHiddenPrefixDecoder<TTo>(
    decoder: Decoder<TTo>,
    prefixedDecoders: readonly Decoder<void>[],
): VariableSizeDecoder<TTo>;
export function getHiddenPrefixDecoder<TTo>(
    decoder: Decoder<TTo>,
    prefixedDecoders: readonly Decoder<void>[],
): Decoder<TTo> {
    return transformDecoder(
        getTupleDecoder([...prefixedDecoders, decoder]) as Decoder<readonly [...void[], TTo]>,
        tuple => tuple[tuple.length - 1] as TTo,
    );
}

/**
 * Returns a codec that encodes and decodes values with a hidden prefix.
 *
 * - **Encoding:** Prefixes the value with hidden data before encoding.
 * - **Decoding:** Skips the hidden prefix before decoding the main value.
 *
 * This is useful for any implicit metadata that should be present in
 * binary formats but omitted from the API.
 *
 * @typeParam TFrom - The type of the main value being encoded.
 * @typeParam TTo - The type of the main value being decoded.
 *
 * @param codec - The codec for the main value.
 * @param prefixedCodecs - A list of void codecs that produce the hidden prefix.
 * @returns A `FixedSizeCodec` or `VariableSizeCodec` for encoding and decoding values with a hidden prefix.
 *
 * @example
 * Encoding and decoding a value with prefixed constants.
 * ```ts
 * const codec = getHiddenPrefixCodec(getUtf8Codec(), [
 *   getConstantCodec(new Uint8Array([1, 2, 3])),
 *   getConstantCodec(new Uint8Array([4, 5, 6])),
 * ]);
 *
 * const bytes = codec.encode('Hello');
 * // 0x01020304050648656c6c6f
 * //   |     |     └-- Our encoded value ("Hello").
 * //   |     └-- Our second hidden prefix.
 * //   └-- Our first hidden prefix.
 *
 * codec.decode(bytes);
 * // 'Hello'
 * ```
 *
 * @remarks
 * If all you need is padding zeroes before a value, consider using {@link padLeftCodec} instead.
 *
 * Separate {@link getHiddenPrefixEncoder} and {@link getHiddenPrefixDecoder} functions are available.
 *
 * ```ts
 * const bytes = getHiddenPrefixEncoder(getUtf8Encoder(), [
 *   getConstantEncoder(new Uint8Array([1, 2, 3])),
 *   getConstantEncoder(new Uint8Array([4, 5, 6])),
 * ]).encode('Hello');
 *
 * const value = getHiddenPrefixDecoder(getUtf8Decoder(), [
 *   getConstantDecoder(new Uint8Array([1, 2, 3])),
 *   getConstantDecoder(new Uint8Array([4, 5, 6])),
 * ]).decode(bytes);
 * ```
 *
 * @see {@link getHiddenPrefixEncoder}
 * @see {@link getHiddenPrefixDecoder}
 */
export function getHiddenPrefixCodec<TFrom, TTo extends TFrom>(
    codec: FixedSizeCodec<TFrom, TTo>,
    prefixedCodecs: readonly FixedSizeCodec<void>[],
): FixedSizeCodec<TFrom, TTo>;
export function getHiddenPrefixCodec<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
    prefixedCodecs: readonly Codec<void>[],
): VariableSizeCodec<TFrom, TTo>;
export function getHiddenPrefixCodec<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
    prefixedCodecs: readonly Codec<void>[],
): Codec<TFrom, TTo> {
    return combineCodec(getHiddenPrefixEncoder(codec, prefixedCodecs), getHiddenPrefixDecoder(codec, prefixedCodecs));
}
