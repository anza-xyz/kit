import {
    Codec,
    createCodec,
    createDecoder,
    createEncoder,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    isVariableSize,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from './codec';
import { ReadonlyUint8Array } from './readonly-uint8array';

/**
 * Transforms an encoder by mapping its input values.
 *
 * This function takes an existing `Encoder<A>` and returns an `Encoder<B>`, allowing values of type `B`
 * to be converted into values of type `A` before encoding. The transformation is applied via the `unmap` function.
 *
 * This is useful for handling type conversions, applying default values, or structuring data before encoding.
 *
 * For more details, see {@link transformCodec}.
 *
 * @typeParam TOldFrom - The original type expected by the encoder.
 * @typeParam TNewFrom - The new type that will be transformed before encoding.
 *
 * @param encoder - The encoder to transform.
 * @param unmap - A function that converts values of `TNewFrom` into `TOldFrom` before encoding.
 * @returns A new encoder that accepts `TNewFrom` values and transforms them before encoding.
 *
 * @example
 * Encoding a string by counting its characters and storing the length as a `u32`.
 * ```ts
 * const encoder = transformEncoder(getU32Encoder(), (value: string) => value.length);
 * encoder.encode("hello"); // 0x05000000 (stores length 5)
 * ```
 *
 * @see {@link transformCodec}
 * @see {@link transformDecoder}
 */
export function transformEncoder<TOldFrom, TNewFrom, TSize extends number>(
    encoder: FixedSizeEncoder<TOldFrom, TSize>,
    unmap: (value: TNewFrom) => TOldFrom,
): FixedSizeEncoder<TNewFrom, TSize>;
export function transformEncoder<TOldFrom, TNewFrom>(
    encoder: VariableSizeEncoder<TOldFrom>,
    unmap: (value: TNewFrom) => TOldFrom,
): VariableSizeEncoder<TNewFrom>;
export function transformEncoder<TOldFrom, TNewFrom>(
    encoder: Encoder<TOldFrom>,
    unmap: (value: TNewFrom) => TOldFrom,
): Encoder<TNewFrom>;
export function transformEncoder<TOldFrom, TNewFrom>(
    encoder: Encoder<TOldFrom>,
    unmap: (value: TNewFrom) => TOldFrom,
): Encoder<TNewFrom> {
    return createEncoder({
        ...(isVariableSize(encoder)
            ? { ...encoder, getSizeFromValue: (value: TNewFrom) => encoder.getSizeFromValue(unmap(value)) }
            : encoder),
        write: (value: TNewFrom, bytes, offset) => encoder.write(unmap(value), bytes, offset),
    });
}

/**
 * Transforms a decoder by mapping its output values.
 *
 * This function takes an existing `Decoder<A>` and returns a `Decoder<B>`, allowing values of type `A`
 * to be converted into values of type `B` after decoding. The transformation is applied via the `map` function.
 *
 * This is useful for post-processing, type conversions, or enriching decoded data.
 *
 * For more details, see {@link transformCodec}.
 *
 * @typeParam TOldTo - The original type returned by the decoder.
 * @typeParam TNewTo - The new type that will be transformed after decoding.
 *
 * @param decoder - The decoder to transform.
 * @param map - A function that converts values of `TOldTo` into `TNewTo` after decoding.
 * @returns A new decoder that decodes into `TNewTo`.
 *
 * @example
 * Decoding a stored `u32` length into a string of `'x'` characters.
 * ```ts
 * const decoder = transformDecoder(getU32Decoder(), (length) => 'x'.repeat(length));
 * decoder.decode(new Uint8Array([0x05, 0x00, 0x00, 0x00])); // "xxxxx"
 * ```
 *
 * @see {@link transformCodec}
 * @see {@link transformEncoder}
 */
export function transformDecoder<TOldTo, TNewTo, TSize extends number>(
    decoder: FixedSizeDecoder<TOldTo, TSize>,
    map: (value: TOldTo, bytes: ReadonlyUint8Array | Uint8Array, offset: number) => TNewTo,
): FixedSizeDecoder<TNewTo, TSize>;
export function transformDecoder<TOldTo, TNewTo>(
    decoder: VariableSizeDecoder<TOldTo>,
    map: (value: TOldTo, bytes: ReadonlyUint8Array | Uint8Array, offset: number) => TNewTo,
): VariableSizeDecoder<TNewTo>;
export function transformDecoder<TOldTo, TNewTo>(
    decoder: Decoder<TOldTo>,
    map: (value: TOldTo, bytes: ReadonlyUint8Array | Uint8Array, offset: number) => TNewTo,
): Decoder<TNewTo>;
export function transformDecoder<TOldTo, TNewTo>(
    decoder: Decoder<TOldTo>,
    map: (value: TOldTo, bytes: ReadonlyUint8Array | Uint8Array, offset: number) => TNewTo,
): Decoder<TNewTo> {
    return createDecoder({
        ...decoder,
        read: (bytes: ReadonlyUint8Array | Uint8Array, offset) => {
            const [value, newOffset] = decoder.read(bytes, offset);
            return [map(value, bytes, offset), newOffset];
        },
    });
}

/**
 * Transforms a codec by mapping its input and output values.
 *
 * This function takes an existing `Codec<A, B>` and returns a `Codec<C, D>`, allowing:
 * - Values of type `C` to be transformed into `A` before encoding.
 * - Values of type `B` to be transformed into `D` after decoding.
 *
 * This is useful for adapting codecs to work with different representations, handling default values, or
 * converting between primitive and structured types.
 *
 * @typeParam TOldFrom - The original type expected by the codec.
 * @typeParam TNewFrom - The new type that will be transformed before encoding.
 * @typeParam TOldTo - The original type returned by the codec.
 * @typeParam TNewTo - The new type that will be transformed after decoding.
 *
 * @param codec - The codec to transform.
 * @param unmap - A function that converts values of `TNewFrom` into `TOldFrom` before encoding.
 * @param map - A function that converts values of `TOldTo` into `TNewTo` after decoding (optional).
 * @returns A new codec that encodes `TNewFrom` and decodes into `TNewTo`.
 *
 * @example
 * Mapping a `u32` codec to encode string lengths and decode them into `'x'` characters.
 * ```ts
 * const codec = transformCodec(
 *     getU32Codec(),
 *     (value: string) => value.length, // Encode string length
 *     (length) => 'x'.repeat(length)  // Decode length into a string of 'x's
 * );
 *
 * const bytes = codec.encode("hello"); // 0x05000000 (stores length 5)
 * const value = codec.decode(bytes);   // "xxxxx"
 * ```
 *
 * @remarks
 * If only input transformation is needed, use {@link transformEncoder}.
 * If only output transformation is needed, use {@link transformDecoder}.
 *
 * ```ts
 * const bytes = transformEncoder(getU32Encoder(), (value: string) => value.length).encode("hello");
 * const value = transformDecoder(getU32Decoder(), (length) => 'x'.repeat(length)).decode(bytes);
 * ```
 *
 * @see {@link transformEncoder}
 * @see {@link transformDecoder}
 */
export function transformCodec<TOldFrom, TNewFrom, TTo extends TNewFrom & TOldFrom, TSize extends number>(
    codec: FixedSizeCodec<TOldFrom, TTo, TSize>,
    unmap: (value: TNewFrom) => TOldFrom,
): FixedSizeCodec<TNewFrom, TTo, TSize>;
export function transformCodec<TOldFrom, TNewFrom, TTo extends TNewFrom & TOldFrom>(
    codec: VariableSizeCodec<TOldFrom, TTo>,
    unmap: (value: TNewFrom) => TOldFrom,
): VariableSizeCodec<TNewFrom, TTo>;
export function transformCodec<TOldFrom, TNewFrom, TTo extends TNewFrom & TOldFrom>(
    codec: Codec<TOldFrom, TTo>,
    unmap: (value: TNewFrom) => TOldFrom,
): Codec<TNewFrom, TTo>;
export function transformCodec<
    TOldFrom,
    TNewFrom,
    TOldTo extends TOldFrom,
    TNewTo extends TNewFrom,
    TSize extends number,
>(
    codec: FixedSizeCodec<TOldFrom, TOldTo, TSize>,
    unmap: (value: TNewFrom) => TOldFrom,
    map: (value: TOldTo, bytes: ReadonlyUint8Array | Uint8Array, offset: number) => TNewTo,
): FixedSizeCodec<TNewFrom, TNewTo, TSize>;
export function transformCodec<TOldFrom, TNewFrom, TOldTo extends TOldFrom, TNewTo extends TNewFrom>(
    codec: VariableSizeCodec<TOldFrom, TOldTo>,
    unmap: (value: TNewFrom) => TOldFrom,
    map: (value: TOldTo, bytes: ReadonlyUint8Array | Uint8Array, offset: number) => TNewTo,
): VariableSizeCodec<TNewFrom, TNewTo>;
export function transformCodec<TOldFrom, TNewFrom, TOldTo extends TOldFrom, TNewTo extends TNewFrom>(
    codec: Codec<TOldFrom, TOldTo>,
    unmap: (value: TNewFrom) => TOldFrom,
    map: (value: TOldTo, bytes: ReadonlyUint8Array | Uint8Array, offset: number) => TNewTo,
): Codec<TNewFrom, TNewTo>;
export function transformCodec<TOldFrom, TNewFrom, TOldTo extends TOldFrom, TNewTo extends TNewFrom>(
    codec: Codec<TOldFrom, TOldTo>,
    unmap: (value: TNewFrom) => TOldFrom,
    map?: (value: TOldTo, bytes: ReadonlyUint8Array | Uint8Array, offset: number) => TNewTo,
): Codec<TNewFrom, TNewTo> {
    return createCodec({
        ...transformEncoder(codec, unmap),
        read: map ? transformDecoder(codec, map).read : (codec.read as unknown as Decoder<TNewTo>['read']),
    });
}
