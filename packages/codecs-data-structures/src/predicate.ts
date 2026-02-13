import {
    Codec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import { getUnionCodec, getUnionDecoder, getUnionEncoder } from './union';

/**
 * Returns an encoder that selects between two encoders based on a predicate.
 *
 * This encoder uses a boolean predicate function to determine which of two
 * encoders to use for a given value. If the predicate returns `true`, the
 * `ifTrue` encoder is used; otherwise, the `ifFalse` encoder is used.
 *
 * @typeParam TFrom - The type of the value to encode.
 *
 * @param predicate - A function that returns `true` or `false` for a given value.
 * @param ifTrue - The encoder to use when the predicate returns `true`.
 * @param ifFalse - The encoder to use when the predicate returns `false`.
 * @returns An `Encoder` based on the provided encoders.
 *
 * @example
 * Encoding small and large numbers differently.
 * ```ts
 * const encoder = getPredicateEncoder(
 *   (n: number) => n < 256,
 *   getU8Encoder(),
 *   getU32Encoder()
 * );
 *
 * encoder.encode(42);
 * // 0x2a
 * //   └── Small number encoded as u8
 *
 * encoder.encode(1000);
 * // 0xe8030000
 * //   └── Large number encoded as u32
 * ```
 *
 * @see {@link getPredicateCodec}
 */
export function getPredicateEncoder<TFrom, TSize extends number>(
    predicate: (value: TFrom) => boolean,
    ifTrue: FixedSizeEncoder<TFrom, TSize>,
    ifFalse: FixedSizeEncoder<TFrom, TSize>,
): FixedSizeEncoder<TFrom, TSize>;
export function getPredicateEncoder<TFrom>(
    predicate: (value: TFrom) => boolean,
    ifTrue: FixedSizeEncoder<TFrom>,
    ifFalse: FixedSizeEncoder<TFrom>,
): FixedSizeEncoder<TFrom>;
export function getPredicateEncoder<TFrom>(
    predicate: (value: TFrom) => boolean,
    ifTrue: VariableSizeEncoder<TFrom>,
    ifFalse: VariableSizeEncoder<TFrom>,
): VariableSizeEncoder<TFrom>;
export function getPredicateEncoder<TFrom>(
    predicate: (value: TFrom) => boolean,
    ifTrue: Encoder<TFrom>,
    ifFalse: Encoder<TFrom>,
): Encoder<TFrom>;
export function getPredicateEncoder<TFrom>(
    predicate: (value: TFrom) => boolean,
    ifTrue: Encoder<TFrom>,
    ifFalse: Encoder<TFrom>,
): Encoder<TFrom> {
    return getUnionEncoder([ifTrue, ifFalse], (value: TFrom) => (predicate(value) ? 0 : 1));
}

/**
 * Returns a decoder that selects between two decoders based on a predicate.
 *
 * This decoder uses a boolean predicate function on the raw bytes to determine
 * which of two decoders to use. If the predicate returns `true`, the `ifTrue`
 * decoder is used; otherwise, the `ifFalse` decoder is used.
 *
 * @typeParam TTo - The type of the value to decode.
 *
 * @param predicate - A function that returns `true` or `false` for a given byte array.
 * @param ifTrue - The decoder to use when the predicate returns `true`.
 * @param ifFalse - The decoder to use when the predicate returns `false`.
 * @returns A `Decoder` based on the provided decoders.
 *
 * @example
 * Decoding small and large numbers based on byte length.
 * ```ts
 * const decoder = getPredicateDecoder(
 *   bytes => bytes.length === 1,
 *   getU8Decoder(),
 *   getU32Decoder()
 * );
 *
 * decoder.decode(new Uint8Array([0x2a]));
 * // 42 (decoded as u8)
 *
 * decoder.decode(new Uint8Array([0xe8, 0x03, 0x00, 0x00]));
 * // 1000 (decoded as u32)
 * ```
 *
 * @see {@link getPredicateCodec}
 */
export function getPredicateDecoder<TTo, TSize extends number>(
    predicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: FixedSizeDecoder<TTo, TSize>,
    ifFalse: FixedSizeDecoder<TTo, TSize>,
): FixedSizeDecoder<TTo, TSize>;
export function getPredicateDecoder<TTo>(
    predicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: FixedSizeDecoder<TTo>,
    ifFalse: FixedSizeDecoder<TTo>,
): FixedSizeDecoder<TTo>;
export function getPredicateDecoder<TTo>(
    predicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: VariableSizeDecoder<TTo>,
    ifFalse: VariableSizeDecoder<TTo>,
): VariableSizeDecoder<TTo>;
export function getPredicateDecoder<TTo>(
    predicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: Decoder<TTo>,
    ifFalse: Decoder<TTo>,
): Decoder<TTo>;
export function getPredicateDecoder<TTo>(
    predicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: Decoder<TTo>,
    ifFalse: Decoder<TTo>,
): Decoder<TTo> {
    return getUnionDecoder([ifTrue, ifFalse], (value: ReadonlyUint8Array) => (predicate(value) ? 0 : 1));
}

/**
 * Returns a codec that selects between two codecs based on predicates.
 *
 * This codec uses boolean predicate functions to determine which of two codecs
 * to use for encoding and decoding. If the encoding predicate returns `true`
 * for a value, the `ifTrue` codec is used to encode it; otherwise `ifFalse`.
 * Similarly, if the decoding predicate returns `true` for the bytes, the
 * `ifTrue` codec is used to decode them.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the value to decode.
 *
 * @param encodePredicate - A function that returns `true` or `false` for a given value.
 * @param decodePredicate - A function that returns `true` or `false` for a given byte array.
 * @param ifTrue - The codec to use when the respective predicate returns `true`.
 * @param ifFalse - The codec to use when the respective predicate returns `false`.
 * @returns A `Codec` based on the provided codecs.
 *
 * @example
 * Encoding and decoding small and large numbers differently.
 * ```ts
 * const codec = getPredicateCodec(
 *   (n: number) => n < 256,
 *   bytes => bytes.length === 1,
 *   getU8Codec(),
 *   getU32Codec()
 * );
 *
 * const smallBytes = codec.encode(42);
 * // 0x2a (encoded as u8)
 *
 * const largeBytes = codec.encode(1000);
 * // 0xe8030000 (encoded as u32)
 *
 * codec.decode(smallBytes); // 42
 * codec.decode(largeBytes); // 1000
 * ```
 *
 * @see {@link getPredicateEncoder}
 * @see {@link getPredicateDecoder}
 */
export function getPredicateCodec<TFrom, TTo extends TFrom, TSize extends number>(
    encodePredicate: (value: TFrom) => boolean,
    decodePredicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: FixedSizeCodec<TFrom, TTo, TSize>,
    ifFalse: FixedSizeCodec<TFrom, TTo, TSize>,
): FixedSizeCodec<TFrom, TTo, TSize>;
export function getPredicateCodec<TFrom, TTo extends TFrom>(
    encodePredicate: (value: TFrom) => boolean,
    decodePredicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: FixedSizeCodec<TFrom, TTo>,
    ifFalse: FixedSizeCodec<TFrom, TTo>,
): FixedSizeCodec<TFrom, TTo>;
export function getPredicateCodec<TFrom, TTo extends TFrom>(
    encodePredicate: (value: TFrom) => boolean,
    decodePredicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: VariableSizeCodec<TFrom, TTo>,
    ifFalse: VariableSizeCodec<TFrom, TTo>,
): VariableSizeCodec<TFrom, TTo>;
export function getPredicateCodec<TFrom, TTo extends TFrom>(
    encodePredicate: (value: TFrom) => boolean,
    decodePredicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: Codec<TFrom, TTo>,
    ifFalse: Codec<TFrom, TTo>,
): Codec<TFrom, TTo>;
export function getPredicateCodec<TFrom, TTo extends TFrom>(
    encodePredicate: (value: TFrom) => boolean,
    decodePredicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: Codec<TFrom, TTo>,
    ifFalse: Codec<TFrom, TTo>,
): Codec<TFrom, TTo> {
    return getUnionCodec(
        [ifTrue, ifFalse],
        (value: TFrom) => (encodePredicate(value) ? 0 : 1),
        (value: ReadonlyUint8Array) => (decodePredicate(value) ? 0 : 1),
    );
}
