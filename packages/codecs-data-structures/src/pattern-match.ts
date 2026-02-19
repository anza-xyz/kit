import { Codec, Decoder, Encoder, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder, ReadonlyUint8Array, VariableSizeCodec, VariableSizeDecoder, VariableSizeEncoder } from "@solana/codecs-core";
import { getUnionCodec, getUnionDecoder, getUnionEncoder } from "./union";
import { SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES, SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE, SolanaError } from "@solana/errors";

/**
 * Returns an encoder that selects which variant encoder to use based on pattern matching.
 *
 * This encoder evaluates the value against a series of predicate functions in order,
 * and uses the first matching encoder to encode the value.
 *
 * For more details, see {@link getPatternMatchCodec}.
 *
 * @typeParam TFrom - The type of values that can be encoded.
 * @typeParam TSize - The fixed size of the encoded value, if applicable.
 *
 * @param patterns - An array of `[predicate, encoder]` pairs. Predicates are tested in order
 * and the first matching encoder is used to encode the value.
 * @returns An encoder that selects the appropriate variant based on the matched pattern.
 *
 * @throws Throws a {@link SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE} error
 * if the value does not match any of the specified patterns.
 *
 * @example
 * Encoding values using pattern matching.
 * ```ts
 * const encoder = getPatternMatchEncoder([
 *   [(value) => typeof value === 'number', getU16Encoder()],
 *   [(value) => typeof value === 'boolean', getBooleanEncoder()],
 * ]);
 *
 * encoder.encode(42);   // 0x2a00 (encoded as u16)
 * encoder.encode(true); // 0x01 (encoded as boolean)
 * ```
 *
 * @see {@link getPatternMatchCodec}
 * @see {@link getPatternMatchDecoder}
 */
export function getPatternMatchEncoder<TFrom, TSize extends number>(
    patterns: [(value: TFrom) => boolean, FixedSizeEncoder<TFrom, TSize>][]
): FixedSizeEncoder<TFrom, TSize>;
export function getPatternMatchEncoder<TFrom>(
    patterns: [(value: TFrom) => boolean, FixedSizeEncoder<TFrom>][]
): FixedSizeEncoder<TFrom>;
export function getPatternMatchEncoder<TFrom>(
    patterns: [(value: TFrom) => boolean, VariableSizeEncoder<TFrom>][]
): VariableSizeEncoder<TFrom>;
export function getPatternMatchEncoder<TFrom>(
    patterns: [(value: TFrom) => boolean, Encoder<TFrom>][]
): Encoder<TFrom>;
export function getPatternMatchEncoder<TFrom>(
    patterns: [(value: TFrom) => boolean, Encoder<TFrom>][]
): Encoder<TFrom> {
    return getUnionEncoder(
        patterns.map(([, encoder]) => encoder) as Encoder<TFrom>[],
        (value: TFrom) => {
            const index = patterns.findIndex(([predicate]) => predicate(value))
            if (index === -1) {
                throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE);
            }
            return index;
        }
    )
}

/**
 * Returns a decoder that selects which variant decoder to use based on pattern matching.
 *
 * This decoder evaluates the byte array against a series of predicate functions in order,
 * and uses the first matching decoder to decode the value.
 *
 * For more details, see {@link getPatternMatchCodec}.
 *
 * @typeParam TTo - The type of values that will be decoded.
 * @typeParam TSize - The fixed size of the encoded value, if applicable.
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
 *   [(bytes) => bytes.length >= 2, getU16Decoder()],
 *   [(bytes) => bytes.length === 1, getBooleanDecoder()],
 * ]);
 *
 * decoder.decode(new Uint8Array([0x2a, 0x00])); // 42 (decoded as u16)
 * decoder.decode(new Uint8Array([0x01]));       // true (decoded as boolean)
 * ```
 *
 * @see {@link getPatternMatchCodec}
 * @see {@link getPatternMatchEncoder}
 */
export function getPatternMatchDecoder<TTo, TSize extends number>(
    patterns: [(value: ReadonlyUint8Array) => boolean, FixedSizeDecoder<TTo, TSize>][]
): FixedSizeDecoder<TTo, TSize>;
export function getPatternMatchDecoder<TTo>(
    patterns: [(value: ReadonlyUint8Array) => boolean, FixedSizeDecoder<TTo>][]
): FixedSizeDecoder<TTo>;
export function getPatternMatchDecoder<TTo>(
    patterns: [(value: ReadonlyUint8Array) => boolean, VariableSizeDecoder<TTo>][]
): VariableSizeDecoder<TTo>;
export function getPatternMatchDecoder<TTo>(
    patterns: [(value: ReadonlyUint8Array) => boolean, Decoder<TTo>][]
): Decoder<TTo>;
export function getPatternMatchDecoder<TTo>(
    patterns: [(value: ReadonlyUint8Array) => boolean, Decoder<TTo>][]
): Decoder<TTo> {
    return getUnionDecoder(
        patterns.map(([, decoder]) => decoder) as Decoder<TTo>[],
        (value: ReadonlyUint8Array) => {
            const index = patterns.findIndex(([predicate]) => predicate(value))
            if (index === -1) {
                throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES, {
                    bytes: value,
                })
            }
            return index;
        }
    )
}

/**
 * Returns a codec that selects which variant codec to use based on pattern matching.
 *
 * This codec evaluates values and byte arrays against a series of predicate functions in order,
 * using the first matching codec for encoding or decoding.
 *
 * Unlike {@link getUnionCodec}, this codec determines which variant to use via predicate
 * functions on the value or bytes, rather than an explicit index function. This is useful
 * when the variant can be inferred from the data itself.
 *
 * @typeParam TFrom - The type of values that can be encoded.
 * @typeParam TTo - The type of values that will be decoded (extends TFrom).
 * @typeParam TSize - The fixed size of the encoded value, if applicable.
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
 *   [
 *     (value): value is number => typeof value === 'number',
 *     (bytes) => bytes.length >= 2,
 *     getU16Codec(),
 *   ],
 *   [
 *     (value): value is boolean => typeof value === 'boolean',
 *     (bytes) => bytes.length === 1,
 *     getBooleanCodec(),
 *   ],
 * ]);
 *
 * const bytes1 = codec.encode(42);     // 0x2a00
 * const value1 = codec.decode(bytes1); // 42
 *
 * const bytes2 = codec.encode(true);   // 0x01
 * const value2 = codec.decode(bytes2); // true
 * ```
 * 
 * @see {@link getPatternMatchEncoder}
 * @see {@link getPatternMatchDecoder}
 * @see {@link getUnionCodec}
 */
export function getPatternMatchCodec<TFrom, TTo extends TFrom, TSize extends number>(
    patterns: [(value: TFrom) => boolean, (bytes: ReadonlyUint8Array) => boolean, FixedSizeCodec<TFrom, TTo, TSize>][]
): FixedSizeCodec<TFrom, TTo, TSize>;
export function getPatternMatchCodec<TFrom, TTo extends TFrom>(
    patterns: [(value: TFrom) => boolean, (bytes: ReadonlyUint8Array) => boolean, FixedSizeCodec<TFrom, TTo>][]
): FixedSizeCodec<TFrom, TTo>;
export function getPatternMatchCodec<TFrom, TTo extends TFrom>(
    patterns: [(value: TFrom) => boolean, (bytes: ReadonlyUint8Array) => boolean, VariableSizeCodec<TFrom, TTo>][]
): VariableSizeCodec<TFrom, TTo>;
export function getPatternMatchCodec<TFrom, TTo extends TFrom>(
    patterns: [(value: TFrom) => boolean, (bytes: ReadonlyUint8Array) => boolean, Codec<TFrom, TTo>][]
): Codec<TFrom, TTo>;
export function getPatternMatchCodec<TFrom, TTo extends TFrom>(
    patterns: [(value: TFrom) => boolean, (bytes: ReadonlyUint8Array) => boolean, Codec<TFrom, TTo>][]
): Codec<TFrom, TTo> {
    return getUnionCodec(
        patterns.map(([, , codec]) => codec) as Codec<TFrom, TTo>[],
        (value: TFrom) => {
            const index = patterns.findIndex(([predicate]) => predicate(value))
            if (index === -1) {
                throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_VALUE);
            }
            return index;
        },
        (value: ReadonlyUint8Array) => {
            const index = patterns.findIndex(([, predicate]) => predicate(value))
            if (index === -1) {
                throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_PATTERN_MATCH_BYTES, {
                    bytes: value,
                })
            }
            return index;
        }
    )
}
