/* eslint-disable @typescript-eslint/no-explicit-any */
import { Codec, Decoder, Encoder, ReadonlyUint8Array } from '@solana/codecs-core';

import { getUnionCodec, getUnionDecoder, getUnionEncoder } from './union';
import {
    GetDecoderTypeFromVariants,
    GetEncoderTypeFromVariants,
    GetUnionCodecType,
    GetUnionDecoderType,
    GetUnionEncoderType,
} from './utils';

// Keep predicate branches on one value type. Pattern matching supports type guards for narrowed branches.
type SameType<TExpected, TActual> = [TExpected] extends [TActual]
    ? [TActual] extends [TExpected]
        ? unknown
        : never
    : never;

type SameEncoderType<TIfTrue extends Encoder<any>, TIfFalse extends Encoder<any>> = SameType<
    GetEncoderTypeFromVariants<readonly [TIfTrue]>,
    GetEncoderTypeFromVariants<readonly [TIfFalse]>
>;

type SameDecoderType<TIfTrue extends Decoder<any>, TIfFalse extends Decoder<any>> = SameType<
    GetDecoderTypeFromVariants<readonly [TIfTrue]>,
    GetDecoderTypeFromVariants<readonly [TIfFalse]>
>;

type SameCodecType<TIfTrue extends Codec<any>, TIfFalse extends Codec<any>> = SameType<
    GetEncoderTypeFromVariants<readonly [TIfTrue]>,
    GetEncoderTypeFromVariants<readonly [TIfFalse]>
> &
    SameType<GetDecoderTypeFromVariants<readonly [TIfTrue]>, GetDecoderTypeFromVariants<readonly [TIfFalse]>>;

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
export function getPredicateEncoder<
    TFrom = any,
    const TIfTrue extends Encoder<TFrom> = Encoder<TFrom>,
    const TIfFalse extends Encoder<TFrom> = Encoder<TFrom>,
>(
    predicate: (value: TFrom) => boolean,
    ifTrue: TIfTrue,
    ifFalse: SameEncoderType<TIfTrue, TIfFalse> & TIfFalse,
): GetUnionEncoderType<readonly [TIfTrue, TIfFalse]> {
    return getUnionEncoder([ifTrue, ifFalse], (value: GetEncoderTypeFromVariants<readonly [TIfTrue, TIfFalse]>) =>
        predicate(value as TFrom) ? 0 : 1,
    ) as GetUnionEncoderType<readonly [TIfTrue, TIfFalse]>;
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
export function getPredicateDecoder<
    TTo = any,
    const TIfTrue extends Decoder<TTo> = Decoder<TTo>,
    const TIfFalse extends Decoder<TTo> = Decoder<TTo>,
>(
    predicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: TIfTrue,
    ifFalse: SameDecoderType<TIfTrue, TIfFalse> & TIfFalse,
): GetUnionDecoderType<readonly [TIfTrue, TIfFalse]> {
    return getUnionDecoder([ifTrue, ifFalse], (value: ReadonlyUint8Array) =>
        predicate(value) ? 0 : 1,
    ) as GetUnionDecoderType<readonly [TIfTrue, TIfFalse]>;
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
export function getPredicateCodec<
    TFrom = any,
    TTo extends TFrom = TFrom,
    const TIfTrue extends Codec<TFrom, TTo> = Codec<TFrom, TTo>,
    const TIfFalse extends Codec<TFrom, TTo> = Codec<TFrom, TTo>,
>(
    encodePredicate: (value: TFrom) => boolean,
    decodePredicate: (value: ReadonlyUint8Array) => boolean,
    ifTrue: TIfTrue,
    ifFalse: SameCodecType<TIfTrue, TIfFalse> & TIfFalse,
): GetUnionCodecType<readonly [TIfTrue, TIfFalse]> {
    return getUnionCodec(
        [ifTrue, ifFalse],
        (value: GetEncoderTypeFromVariants<readonly [TIfTrue, TIfFalse]>) => (encodePredicate(value as TFrom) ? 0 : 1),
        (value: ReadonlyUint8Array) => (decodePredicate(value) ? 0 : 1),
    ) as GetUnionCodecType<readonly [TIfTrue, TIfFalse]>;
}
