/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Codec,
    combineCodec,
    createDecoder,
    createEncoder,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    getEncodedSize,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import { assertValidNumberOfItemsForCodec } from './assertions';
import { DrainOuterGeneric, getFixedSize, getMaxSize, sumCodecSizes } from './utils';

/**
 * Infers the TypeScript type for a tuple that can be encoded using a tuple codec.
 *
 * This type maps each provided item encoder to its corresponding value type.
 *
 * @typeParam TItems - An array of encoders, each corresponding to a tuple element.
 */
type GetEncoderTypeFromItems<TItems extends readonly Encoder<any>[]> = DrainOuterGeneric<{
    [I in keyof TItems]: TItems[I] extends Encoder<infer TFrom> ? TFrom : never;
}>;

/**
 * Infers the TypeScript type for a tuple that can be decoded using a tuple codec.
 *
 * This type maps each provided item decoder to its corresponding value type.
 *
 * @typeParam TItems - An array of decoders, each corresponding to a tuple element.
 */
type GetDecoderTypeFromItems<TItems extends readonly Decoder<any>[]> = DrainOuterGeneric<{
    [I in keyof TItems]: TItems[I] extends Decoder<infer TTo> ? TTo : never;
}>;

/**
 * Returns an encoder for tuples.
 *
 * This encoder serializes a fixed-size array (tuple) by encoding its items
 * sequentially using the provided item encoders.
 *
 * For more details, see {@link getTupleCodec}.
 *
 * @typeParam TItems - An array of encoders, each corresponding to a tuple element.
 *
 * @param items - The encoders for each item in the tuple.
 * @returns A `FixedSizeEncoder` or `VariableSizeEncoder` for encoding tuples.
 *
 * @example
 * Encoding a tuple with 2 items.
 * ```ts
 * const encoder = getTupleEncoder([fixCodecSize(getUtf8Encoder(), 5), getU8Encoder()]);
 *
 * const bytes = encoder.encode(['Alice', 42]);
 * // 0x416c6963652a
 * //   |         └── Second item (42)
 * //   └── First item ("Alice")
 * ```
 *
 * @see {@link getTupleCodec}
 */
export function getTupleEncoder<const TItems extends readonly FixedSizeEncoder<any>[]>(
    items: TItems,
): FixedSizeEncoder<GetEncoderTypeFromItems<TItems>>;
export function getTupleEncoder<const TItems extends readonly Encoder<any>[]>(
    items: TItems,
): VariableSizeEncoder<GetEncoderTypeFromItems<TItems>>;
export function getTupleEncoder<const TItems extends readonly Encoder<any>[]>(
    items: TItems,
): Encoder<GetEncoderTypeFromItems<TItems>> {
    type TFrom = GetEncoderTypeFromItems<TItems>;
    const fixedSize = sumCodecSizes(items.map(getFixedSize));
    const maxSize = sumCodecSizes(items.map(getMaxSize)) ?? undefined;

    return createEncoder({
        ...(fixedSize === null
            ? {
                  getSizeFromValue: (value: TFrom) =>
                      items.map((item, index) => getEncodedSize(value[index], item)).reduce((all, one) => all + one, 0),
                  maxSize,
              }
            : { fixedSize }),
        write: (value: TFrom, bytes, offset) => {
            assertValidNumberOfItemsForCodec('tuple', items.length, value.length);
            items.forEach((item, index) => {
                offset = item.write(value[index], bytes, offset);
            });
            return offset;
        },
    });
}

/**
 * Returns a decoder for tuples.
 *
 * This decoder deserializes a fixed-size array (tuple) by decoding its items
 * sequentially using the provided item decoders.
 *
 * For more details, see {@link getTupleCodec}.
 *
 * @typeParam TItems - An array of decoders, each corresponding to a tuple element.
 *
 * @param items - The decoders for each item in the tuple.
 * @returns A `FixedSizeDecoder` or `VariableSizeDecoder` for decoding tuples.
 *
 * @example
 * Decoding a tuple with 2 items.
 * ```ts
 * const decoder = getTupleDecoder([fixCodecSize(getUtf8Decoder(), 5), getU8Decoder()]);
 *
 * const tuple = decoder.decode(new Uint8Array([
 *   0x41,0x6c,0x69,0x63,0x65,0x2a
 * ]));
 * // ['Alice', 42]
 * ```
 *
 * @see {@link getTupleCodec}
 */
export function getTupleDecoder<const TItems extends readonly FixedSizeDecoder<any>[]>(
    items: TItems,
): FixedSizeDecoder<GetDecoderTypeFromItems<TItems>>;
export function getTupleDecoder<const TItems extends readonly Decoder<any>[]>(
    items: TItems,
): VariableSizeDecoder<GetDecoderTypeFromItems<TItems>>;
export function getTupleDecoder<const TItems extends readonly Decoder<any>[]>(
    items: TItems,
): Decoder<GetDecoderTypeFromItems<TItems>> {
    type TTo = GetDecoderTypeFromItems<TItems>;
    const fixedSize = sumCodecSizes(items.map(getFixedSize));
    const maxSize = sumCodecSizes(items.map(getMaxSize)) ?? undefined;

    return createDecoder({
        ...(fixedSize === null ? { maxSize } : { fixedSize }),
        read: (bytes: ReadonlyUint8Array | Uint8Array, offset) => {
            const values = [] as Array<any> & TTo;
            items.forEach(item => {
                const [newValue, newOffset] = item.read(bytes, offset);
                values.push(newValue);
                offset = newOffset;
            });
            return [values, offset];
        },
    });
}

/**
 * Returns a codec for encoding and decoding tuples.
 *
 * This codec serializes tuples by encoding and decoding each item sequentially.
 *
 * Unlike the {@link getArrayCodec} codec, each item in the tuple has its own codec
 * and, therefore, can be of a different type.
 *
 * @typeParam TItems - An array of codecs, each corresponding to a tuple element.
 *
 * @param items - The codecs for each item in the tuple.
 * @returns A `FixedSizeCodec` or `VariableSizeCodec` for encoding and decoding tuples.
 *
 * @example
 * Encoding and decoding a tuple with 2 items.
 * ```ts
 * const codec = getTupleCodec([fixCodecSize(getUtf8Codec(), 5), getU8Codec()]);
 *
 * const bytes = codec.encode(['Alice', 42]);
 * // 0x416c6963652a
 * //   |         └── Second item (42)
 * //   └── First item ("Alice")
 *
 * const tuple = codec.decode(bytes);
 * // ['Alice', 42]
 * ```
 *
 * @remarks
 * Separate {@link getTupleEncoder} and {@link getTupleDecoder} functions are available.
 *
 * ```ts
 * const bytes = getTupleEncoder([fixCodecSize(getUtf8Encoder(), 5), getU8Encoder()])
 *   .encode(['Alice', 42]);
 *
 * const tuple = getTupleDecoder([fixCodecSize(getUtf8Decoder(), 5), getU8Decoder()])
 *   .decode(bytes);
 * ```
 *
 * @see {@link getTupleEncoder}
 * @see {@link getTupleDecoder}
 */
export function getTupleCodec<const TItems extends readonly FixedSizeCodec<any>[]>(
    items: TItems,
): FixedSizeCodec<GetEncoderTypeFromItems<TItems>, GetDecoderTypeFromItems<TItems> & GetEncoderTypeFromItems<TItems>>;
export function getTupleCodec<const TItems extends readonly Codec<any>[]>(
    items: TItems,
): VariableSizeCodec<
    GetEncoderTypeFromItems<TItems>,
    GetDecoderTypeFromItems<TItems> & GetEncoderTypeFromItems<TItems>
>;
export function getTupleCodec<const TItems extends readonly Codec<any>[]>(
    items: TItems,
): Codec<GetEncoderTypeFromItems<TItems>, GetDecoderTypeFromItems<TItems> & GetEncoderTypeFromItems<TItems>> {
    return combineCodec(
        getTupleEncoder(items),
        getTupleDecoder(items) as Decoder<GetDecoderTypeFromItems<TItems> & GetEncoderTypeFromItems<TItems>>,
    );
}
