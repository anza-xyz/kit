import { Codec, Decoder, Encoder, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';
/**
 * Represents an encoder for numbers and bigints.
 *
 * This type allows encoding values that are either `number` or `bigint`.
 * Depending on the specific implementation, the encoded output may have a fixed or variable size.
 *
 * @see {@link FixedSizeNumberEncoder}
 */
export type NumberEncoder = Encoder<bigint | number>;

/**
 * Represents a fixed-size encoder for numbers and bigints.
 *
 * This encoder serializes values using an exact number of bytes, defined by `TSize`.
 *
 * @typeParam TSize - The number of bytes used for encoding.
 *
 * @see {@link NumberEncoder}
 */
export type FixedSizeNumberEncoder<TSize extends number = number> = FixedSizeEncoder<bigint | number, TSize>;

/**
 * Represents a decoder for numbers and bigints.
 *
 * This type supports decoding values as either `number` or `bigint`, depending on the implementation.
 *
 * @see {@link FixedSizeNumberDecoder}
 */
export type NumberDecoder = Decoder<bigint> | Decoder<number>;

/**
 * Represents a fixed-size decoder for numbers and bigints.
 *
 * This decoder reads a fixed number of bytes (`TSize`) and converts them into a `number` or `bigint`.
 *
 * @typeParam TSize - The number of bytes expected for decoding.
 *
 * @see {@link NumberDecoder}
 */
export type FixedSizeNumberDecoder<TSize extends number = number> =
    | FixedSizeDecoder<bigint, TSize>
    | FixedSizeDecoder<number, TSize>;

/**
 * Represents a codec for encoding and decoding numbers and bigints.
 *
 * - The encoded value can be either a `number` or a `bigint`.
 * - The decoded value will always be either a `number` or `bigint`, depending on the implementation.
 *
 * @see {@link FixedSizeNumberCodec}
 */
export type NumberCodec = Codec<bigint | number, bigint> | Codec<bigint | number, number>;

/**
 * Represents a fixed-size codec for encoding and decoding numbers and bigints.
 *
 * This codec uses a specific number of bytes (`TSize`) for serialization.
 * The encoded value can be either a `number` or `bigint`, but the decoded value will always be a `number` or `bigint`,
 * depending on the implementation.
 *
 * @typeParam TSize - The number of bytes used for encoding and decoding.
 *
 * @see {@link NumberCodec}
 */
export type FixedSizeNumberCodec<TSize extends number = number> =
    | FixedSizeCodec<bigint | number, bigint, TSize>
    | FixedSizeCodec<bigint | number, number, TSize>;

/**
 * Configuration options for number codecs that use more than one byte.
 *
 * This configuration applies to all number codecs except `u8` and `i8`,
 * allowing the user to specify the endianness of serialization.
 */
export type NumberCodecConfig = {
    /**
     * Specifies whether numbers should be encoded in little-endian or big-endian format.
     *
     * @defaultValue `Endian.Little`
     */
    endian?: Endian;
};

/**
 * Defines the byte order used for number serialization.
 *
 * - `Little`: The least significant byte is stored first.
 * - `Big`: The most significant byte is stored first.
 */
export enum Endian {
    Little,
    Big,
}
