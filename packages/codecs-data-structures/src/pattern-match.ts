/* eslint-disable @typescript-eslint/no-explicit-any */
import { Codec, combineCodec, Decoder, Encoder, ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES,
    SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE,
    SolanaError,
} from '@solana/errors';

import { getUnionDecoder, getUnionEncoder } from './union';
import { GetEncoderTypeFromVariants, GetUnionCodecType, GetUnionDecoderType, GetUnionEncoderType } from './utils';

type PatternMatchEncoderEntry<TNarrowed, TFrom = TNarrowed> = TNarrowed extends TFrom
    ? // Boolean predicate with original encoder
          | readonly [(value: TFrom) => boolean, Encoder<TFrom>]
          // Type predicate with narrowed encoder
          | readonly [(value: TFrom) => value is TNarrowed, Encoder<TNarrowed>]
    : never;

type PatternMatchDecoderEntry<TTo> = readonly [(bytes: ReadonlyUint8Array) => boolean, Decoder<TTo>];

/** Extracts the tuple of variant encoders from a tuple of `[predicate, encoder]` entries. */
type GetPatternMatchEncoders<TPatterns extends readonly PatternMatchEncoderEntry<any>[]> = {
    [I in keyof TPatterns]: TPatterns[I] extends readonly [unknown, infer TEncoder extends Encoder<any>]
        ? TEncoder
        : never;
};

/** Extracts the tuple of variant decoders from a tuple of `[predicate, decoder]` entries. */
type GetPatternMatchDecoders<TPatterns extends readonly PatternMatchDecoderEntry<any>[]> = {
    [I in keyof TPatterns]: TPatterns[I] extends readonly [unknown, infer TDecoder extends Decoder<any>]
        ? TDecoder
        : never;
};

/** Extracts the tuple of variant codecs from a tuple of `[valuePredicate, bytesPredicate, codec]` entries. */
type GetPatternMatchCodecs<TPatterns extends readonly PatternMatchCodecEntry<any>[]> = {
    [I in keyof TPatterns]: TPatterns[I] extends readonly [unknown, unknown, infer TCodec extends Codec<any>]
        ? TCodec
        : never;
};

/**
 * Returns an encoder that selects which variant encoder to use based on pattern matching.
 *
 * This encoder evaluates the value against a series of predicate functions in order,
 * and uses the first matching encoder to encode the value.
 *
 * @typeParam TFrom - The type of the value to encode.
 *
 * @param patterns - An array of `[predicate, encoder]` pairs. Predicates are tested in order
 * and the first matching encoder is used to encode the value. Note that predicates can be either
 * type predicates that narrow the type of the value, or boolean predicates. If using type predicates,
 * the encoder can be for the narrowed type.
 * @returns An encoder that selects the appropriate variant based on the matched pattern.
 *
 * @throws Throws a {@link SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE} error
 * if the value does not match any of the specified patterns.
 *
 * @example
 * Encoding values using pattern matching.
 * ```ts
 * const encoder = getPatternMatchEncoder([
 *   [(n: number) => n < 256, getU8Encoder()],
 *   [(n: number) => n < 2 ** 16, getU16Encoder()],
 *   [(n: number) => n < 2 ** 32, getU32Encoder()]
 * ]);
 *
 * encoder.encode(42);
 * // 0x2a
 * //  └── Small number encoded as u8
 *
 * encoder.encode(1000);
 * // 0xe803
 * //   └── Medium number encoded as u16
 *
 *
 * encoder.encode(100_000);
 * // 0xa0860100
 * //   └── Large number encoded as u32
 *
 * ender.encode(2 ** 32 + 1);
 * // Throws an error because the value does not match any pattern
 * ```
 *
 * @see {@link getPatternMatchCodec}
 */
export function getPatternMatchEncoder<const TPatterns extends readonly PatternMatchEncoderEntry<any>[]>(
    patterns: TPatterns &
        readonly PatternMatchEncoderEntry<GetEncoderTypeFromVariants<GetPatternMatchEncoders<TPatterns>>>[],
): GetUnionEncoderType<GetPatternMatchEncoders<TPatterns>>;
export function getPatternMatchEncoder<TFrom>(patterns: PatternMatchEncoderEntry<TFrom>[]): Encoder<TFrom> {
    return getUnionEncoder(
        patterns.map(([, encoder]) => encoder),
        (value: TFrom) => {
            const index = patterns.findIndex(([predicate]) => predicate(value));
            if (index === -1) {
                throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE);
            }
            return index;
        },
    );
}

/**
 * Returns a decoder that selects which variant decoder to use based on pattern matching.
 *
 * This decoder evaluates the byte array against a series of predicate functions in order,
 * and uses the first matching decoder to decode the value.
 *
 * @typeParam TTo - The type of the value to decode.
 *
 * @param patterns - An array of `[predicate, decoder]` pairs. Predicates are tested in order
 * and the first matching decoder is used to decode the byte array.
 * @returns A decoder that selects the appropriate variant based on the matched byte pattern.
 *
 * @throws Throws a {@link SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES} error
 * if the byte array does not match any of the specified patterns.
 *
 * @example
 * Decoding values using pattern matching on bytes.
 * ```ts
 * const decoder = getPatternMatchDecoder([
 *   [(bytes) => bytes.length === 1, getU8Decoder()],
 *   [(bytes) => bytes.length === 2, getU16Decoder()],
 *   [(bytes) => bytes.length <= 4, getU32Decoder()]
 * ]);
 *
 * decoder.decode(new Uint8Array([0x2a])); // 42 (decoded as u8)
 * decoder.decode(new Uint8Array([0xe8, 0x03])) // 1000 (decoded as u16)
 * decoder.decode(new Uint8Array([0xa0, 0x86, 0x01, 0x00])) // 100_000 (decoded as u32)
 * decoder.decode(new Uint8Array([0xa0, 0x86, 0x01, 0x00, 0x00]))
 * // Throws an error because the bytes do not match any pattern
 * ```
 *
 * @see {@link getPatternMatchCodec}
 * @see {@link getPatternMatchEncoder}
 */
export function getPatternMatchDecoder<const TPatterns extends readonly PatternMatchDecoderEntry<any>[]>(
    patterns: TPatterns,
): GetUnionDecoderType<GetPatternMatchDecoders<TPatterns>>;
export function getPatternMatchDecoder<TTo>(
    patterns: [(value: ReadonlyUint8Array) => boolean, Decoder<TTo>][],
): Decoder<TTo> {
    return getUnionDecoder(
        patterns.map(([, decoder]) => decoder),
        (value: ReadonlyUint8Array) => {
            const index = patterns.findIndex(([predicate]) => predicate(value));
            if (index === -1) {
                throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES, {
                    bytes: value,
                });
            }
            return index;
        },
    );
}

type PatternMatchCodecEntry<TNarrowedFrom, TFrom = TNarrowedFrom, TTo = TNarrowedFrom> = TNarrowedFrom extends TFrom
    ? TTo extends TNarrowedFrom
        ?
              | readonly [
                    (value: TFrom) => value is TNarrowedFrom,
                    (bytes: ReadonlyUint8Array) => boolean,
                    Codec<TNarrowedFrom, TTo>,
                ]
              | readonly [(value: TFrom) => boolean, (bytes: ReadonlyUint8Array) => boolean, Codec<TFrom, TTo>]
        : never
    : never;

/**
 * Returns a codec that selects which variant codec to use based on pattern matching.
 *
 * This codec evaluates values and byte arrays against a series of predicate functions in order,
 * using the first matching codec for encoding or decoding.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the value to decode.
 *
 * @param patterns - An array of `[valuePredicate, bytesPredicate, codec]` triples. Predicates
 * are tested in order and the first match determines the codec used. During encoding,
 * `valuePredicate` receives the value to encode. During decoding, `bytesPredicate` receives
 * the byte array.
 * @returns A codec that selects the appropriate variant based on the matched pattern.
 *
 * @throws Throws a {@link SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE} error
 * if a value being encoded does not match any of the specified patterns.
 * @throws Throws a {@link SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES} error
 * if a byte array being decoded does not match any of the specified patterns.
 *
 * @example
 * Encoding and decoding using pattern matching.
 * ```ts
 * const codec = getPatternMatchCodec([
 *  [
 *    (n: number) => n < 256,
 *    (bytes) => bytes.length === 1,
 *    getU8Codec(),
 *  ],
 *  [
 *    (n: number) => n < 2 ** 16,
 *    (bytes) => bytes.length === 2,
 *    getU16Codec(),
 *  ],
 *  [
 *    (n: number) => n < 2 ** 32,
 *    (bytes) => bytes.length <= 4,
 *    getU32Codec(),
 *  ]
 * ]);
 *
 * const bytes1 = codec.encode(42);     // 0x2a, encoded as u8
 * const value1 = codec.decode(bytes1); // 42, decoded as u8
 *
 * const bytes2 = codec.encode(1000);   // 0xe803, encoded as u16
 * const value2 = codec.decode(bytes2); // 1000, decoded as u16
 *
 * const bytes3 = codec.encode(100_000); //0xa0860100, encoded as u32
 * const value3 = codec.decode(bytes3); // 100_000, decoded as u32
 *
 * codec.encode(2 ** 32 + 1);
 * // throws, no encode pattern matches
 * codec.decode(new Uint8Array([0xa0, 0x86, 0x01, 0x00, 0x00]))
 * // throws, no decode pattern matches
 * ```
 *
 * @see {@link getPatternMatchEncoder}
 * @see {@link getPatternMatchDecoder}
 * @see {@link getUnionCodec}
 */
export function getPatternMatchCodec<const TPatterns extends readonly PatternMatchCodecEntry<any>[]>(
    patterns: TPatterns &
        readonly PatternMatchCodecEntry<GetEncoderTypeFromVariants<GetPatternMatchCodecs<TPatterns>>>[],
): GetUnionCodecType<GetPatternMatchCodecs<TPatterns>>;
export function getPatternMatchCodec<TFrom, TTo extends TFrom = TFrom>(
    patterns: PatternMatchCodecEntry<TFrom, TFrom, TTo>[],
): Codec<TFrom, TTo> {
    return combineCodec(
        getPatternMatchEncoder(patterns.map(([valuePredicate, , codec]) => [valuePredicate, codec]) as any),
        getPatternMatchDecoder(patterns.map(([, bytesPredicate, codec]) => [bytesPredicate, codec]) as any),
    );
}
