import {
    SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH,
    SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH,
    SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH,
    SolanaError,
} from '@solana/errors';

import {
    Codec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    isFixedSize,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from './codec';

/**
 * Combines an `Encoder` and a `Decoder` into a `Codec`.
 *
 * That is, given a `Encoder<TFrom>` and a `Decoder<TTo>`, this function returns a `Codec<TFrom, TTo>`.
 *
 * This allows for modular composition by keeping encoding and decoding logic separate
 * while still offering a convenient way to bundle them into a single `Codec`.
 * This is particularly useful for library maintainers who want to expose `Encoders`,
 * `Decoders`, and `Codecs` separately, enabling tree-shaking of unused logic.
 *
 * The provided `Encoder` and `Decoder` must be compatible in terms of:
 * - **Fixed Size:** If both are fixed-size, they must have the same `fixedSize` value.
 * - **Variable Size:** If either has a `maxSize` attribute, it must match the other.
 *
 * If these conditions are not met, a {@link SolanaError} will be thrown.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes (for fixed-size codecs).
 *
 * @param encoder - The `Encoder` to combine.
 * @param decoder - The `Decoder` to combine.
 * @returns A `Codec` that provides both `encode` and `decode` methods.
 *
 * @throws {SolanaError}
 * - `SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH`
 *   Thrown if the encoder and decoder have mismatched size types (fixed vs. variable).
 * - `SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH`
 *   Thrown if both are fixed-size but have different `fixedSize` values.
 * - `SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH`
 *   Thrown if the `maxSize` attributes do not match.
 *
 * @example
 * Creating a fixed-size `Codec` from an encoder and a decoder.
 * ```ts
 * const encoder = getU32Encoder();
 * const decoder = getU32Decoder();
 * const codec = combineCodec(encoder, decoder);
 *
 * const bytes = codec.encode(42); // 0x2a000000
 * const value = codec.decode(bytes); // 42
 * ```
 *
 * @example
 * Creating a variable-size `Codec` from an encoder and a decoder.
 * ```ts
 * const encoder = addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
 * const decoder = addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder());
 * const codec = combineCodec(encoder, decoder);
 *
 * const bytes = codec.encode("hello"); // 0x0500000068656c6c6f
 * const value = codec.decode(bytes); // "hello"
 * ```
 *
 * @remarks
 * The recommended pattern for defining codecs in libraries is to expose separate functions for the encoder, decoder, and codec.
 * This allows users to import only what they need, improving tree-shaking efficiency.
 *
 * ```ts
 * type MyType = \/* ... *\/;
 * const getMyTypeEncoder = (): Encoder<MyType> => { \/* ... *\/ };
 * const getMyTypeDecoder = (): Decoder<MyType> => { \/* ... *\/ };
 * const getMyTypeCodec = (): Codec<MyType> =>
 *     combineCodec(getMyTypeEncoder(), getMyTypeDecoder());
 * ```
 *
 * @see {@link Codec}
 * @see {@link Encoder}
 * @see {@link Decoder}
 */
export function combineCodec<TFrom, TTo extends TFrom, TSize extends number>(
    encoder: FixedSizeEncoder<TFrom, TSize>,
    decoder: FixedSizeDecoder<TTo, TSize>,
): FixedSizeCodec<TFrom, TTo, TSize>;
export function combineCodec<TFrom, TTo extends TFrom>(
    encoder: VariableSizeEncoder<TFrom>,
    decoder: VariableSizeDecoder<TTo>,
): VariableSizeCodec<TFrom, TTo>;
export function combineCodec<TFrom, TTo extends TFrom>(
    encoder: Encoder<TFrom>,
    decoder: Decoder<TTo>,
): Codec<TFrom, TTo>;
export function combineCodec<TFrom, TTo extends TFrom>(
    encoder: Encoder<TFrom>,
    decoder: Decoder<TTo>,
): Codec<TFrom, TTo> {
    if (isFixedSize(encoder) !== isFixedSize(decoder)) {
        throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH);
    }

    if (isFixedSize(encoder) && isFixedSize(decoder) && encoder.fixedSize !== decoder.fixedSize) {
        throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH, {
            decoderFixedSize: decoder.fixedSize,
            encoderFixedSize: encoder.fixedSize,
        });
    }

    if (!isFixedSize(encoder) && !isFixedSize(decoder) && encoder.maxSize !== decoder.maxSize) {
        throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH, {
            decoderMaxSize: decoder.maxSize,
            encoderMaxSize: encoder.maxSize,
        });
    }

    return {
        ...decoder,
        ...encoder,
        decode: decoder.decode,
        encode: encoder.encode,
        read: decoder.read,
        write: encoder.write,
    };
}
