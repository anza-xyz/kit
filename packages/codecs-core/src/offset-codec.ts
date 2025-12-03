import { assertByteArrayOffsetIsNotOutOfRange } from './assertions';
import { Codec, createDecoder, createEncoder, Decoder, Encoder, Offset } from './codec';
import { combineCodec } from './combine-codec';
import { ReadonlyUint8Array } from './readonly-uint8array';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEncoder = Encoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDecoder = Decoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCodec = Codec<any>;

/**
 * Configuration object for modifying the offset of an encoder, decoder, or codec.
 *
 * This type defines optional functions for adjusting the **pre-offset** (before encoding/decoding)
 * and the **post-offset** (after encoding/decoding). These functions allow precise control
 * over where data is written or read within a byte array.
 *
 * @property preOffset - A function that modifies the offset before encoding or decoding.
 * @property postOffset - A function that modifies the offset after encoding or decoding.
 *
 * @example
 * Moving the pre-offset forward by 2 bytes.
 * ```ts
 * const config: OffsetConfig = {
 *     preOffset: ({ preOffset }) => preOffset + 2,
 * };
 * ```
 *
 * @example
 * Moving the post-offset forward by 2 bytes.
 * ```ts
 * const config: OffsetConfig = {
 *     postOffset: ({ postOffset }) => postOffset + 2,
 * };
 * ```
 *
 * @example
 * Using both pre-offset and post-offset together.
 * ```ts
 * const config: OffsetConfig = {
 *     preOffset: ({ preOffset }) => preOffset + 2,
 *     postOffset: ({ postOffset }) => postOffset + 4,
 * };
 * ```
 *
 * @see {@link offsetEncoder}
 * @see {@link offsetDecoder}
 * @see {@link offsetCodec}
 */
type OffsetConfig = {
    postOffset?: PostOffsetFunction;
    preOffset?: PreOffsetFunction;
};

/**
 * Scope provided to the `preOffset` and `postOffset` functions,
 * containing contextual information about the current encoding or decoding process.
 *
 * The pre-offset function modifies where encoding or decoding begins,
 * while the post-offset function modifies where the next operation continues.
 *
 * @property bytes - The entire byte array being encoded or decoded.
 * @property preOffset - The original offset before encoding or decoding starts.
 * @property wrapBytes - A helper function that wraps offsets around the byte array length.
 *
 * @example
 * Using `wrapBytes` to wrap a negative offset to the end of the byte array.
 * ```ts
 * const config: OffsetConfig = {
 *     preOffset: ({ wrapBytes }) => wrapBytes(-4), // Moves to last 4 bytes
 * };
 * ```
 *
 * @example
 * Adjusting the offset dynamically based on the byte array size.
 * ```ts
 * const config: OffsetConfig = {
 *     preOffset: ({ bytes }) => bytes.length > 10 ? 4 : 2,
 * };
 * ```
 *
 * @see {@link PreOffsetFunction}
 * @see {@link PostOffsetFunction}
 */
type PreOffsetFunctionScope = {
    /** The entire byte array. */
    bytes: ReadonlyUint8Array | Uint8Array;
    /** The original offset prior to encode or decode. */
    preOffset: Offset;
    /** Wraps the offset to the byte array length. */
    wrapBytes: (offset: Offset) => Offset;
};

/**
 * A function that modifies the pre-offset before encoding or decoding.
 *
 * This function is used to adjust the starting position before writing
 * or reading data in a byte array.
 *
 * @param scope - The current encoding or decoding context.
 * @returns The new offset at which encoding or decoding should start.
 *
 * @example
 * Skipping the first 2 bytes before writing or reading.
 * ```ts
 * const preOffset: PreOffsetFunction = ({ preOffset }) => preOffset + 2;
 * ```
 *
 * @example
 * Wrapping the offset to ensure it stays within bounds.
 * ```ts
 * const preOffset: PreOffsetFunction = ({ wrapBytes, preOffset }) => wrapBytes(preOffset + 10);
 * ```
 *
 * @see {@link OffsetConfig}
 * @see {@link PreOffsetFunctionScope}
 */
type PreOffsetFunction = (scope: PreOffsetFunctionScope) => Offset;

/**
 * A function that modifies the post-offset after encoding or decoding.
 *
 * This function adjusts where the next encoder or decoder should start
 * after the current operation has completed.
 *
 * @param scope - The current encoding or decoding context, including the modified pre-offset
 * and the original post-offset.
 * @returns The new offset at which the next operation should begin.
 *
 * @example
 * Moving the post-offset forward by 4 bytes.
 * ```ts
 * const postOffset: PostOffsetFunction = ({ postOffset }) => postOffset + 4;
 * ```
 *
 * @example
 * Wrapping the post-offset within the byte array length.
 * ```ts
 * const postOffset: PostOffsetFunction = ({ wrapBytes, postOffset }) => wrapBytes(postOffset);
 * ```
 *
 * @example
 * Ensuring a minimum spacing of 8 bytes between values.
 * ```ts
 * const postOffset: PostOffsetFunction = ({ postOffset, newPreOffset }) =>
 *     Math.max(postOffset, newPreOffset + 8);
 * ```
 *
 * @see {@link OffsetConfig}
 * @see {@link PreOffsetFunctionScope}
 */
type PostOffsetFunction = (
    scope: PreOffsetFunctionScope & {
        /** The modified offset used to encode or decode. */
        newPreOffset: Offset;
        /** The original offset returned by the encoder or decoder. */
        postOffset: Offset;
    },
) => Offset;

/**
 * Moves the offset of a given encoder before and/or after encoding.
 *
 * This function allows an encoder to write its encoded value at a different offset
 * than the one originally provided. It supports both pre-offset adjustments
 * (before encoding) and post-offset adjustments (after encoding).
 *
 * The pre-offset function determines where encoding should start, while the
 * post-offset function adjusts where the next encoder should continue writing.
 *
 * For more details, see {@link offsetCodec}.
 *
 * @typeParam TFrom - The type of the value to encode.
 *
 * @param encoder - The encoder to adjust.
 * @param config - An object specifying how the offset should be modified.
 * @returns A new encoder with adjusted offsets.
 *
 * @example
 * Moving the pre-offset forward by 2 bytes.
 * ```ts
 * const encoder = offsetEncoder(getU32Encoder(), {
 *     preOffset: ({ preOffset }) => preOffset + 2,
 * });
 * const bytes = new Uint8Array(10);
 * encoder.write(42, bytes, 0); // Actually written at offset 2
 * ```
 *
 * @example
 * Moving the post-offset forward by 2 bytes.
 * ```ts
 * const encoder = offsetEncoder(getU32Encoder(), {
 *     postOffset: ({ postOffset }) => postOffset + 2,
 * });
 * const bytes = new Uint8Array(10);
 * const nextOffset = encoder.write(42, bytes, 0); // Next encoder starts at offset 6 instead of 4
 * ```
 *
 * @example
 * Using `wrapBytes` to ensure an offset wraps around the byte array length.
 * ```ts
 * const encoder = offsetEncoder(getU32Encoder(), {
 *     preOffset: ({ wrapBytes }) => wrapBytes(-4), // Moves offset to last 4 bytes of the array
 * });
 * const bytes = new Uint8Array(10);
 * encoder.write(42, bytes, 0); // Writes at bytes.length - 4
 * ```
 *
 * @remarks
 * If you need both encoding and decoding offsets to be adjusted, use {@link offsetCodec}.
 *
 * @see {@link offsetCodec}
 * @see {@link offsetDecoder}
 */
export function offsetEncoder<TEncoder extends AnyEncoder>(encoder: TEncoder, config: OffsetConfig): TEncoder {
    return createEncoder({
        ...encoder,
        write: (value, bytes, preOffset) => {
            const wrapBytes = (offset: Offset) => modulo(offset, bytes.length);
            const newPreOffset = config.preOffset ? config.preOffset({ bytes, preOffset, wrapBytes }) : preOffset;
            assertByteArrayOffsetIsNotOutOfRange('offsetEncoder', newPreOffset, bytes.length);
            const postOffset = encoder.write(value, bytes, newPreOffset);
            const newPostOffset = config.postOffset
                ? config.postOffset({ bytes, newPreOffset, postOffset, preOffset, wrapBytes })
                : postOffset;
            assertByteArrayOffsetIsNotOutOfRange('offsetEncoder', newPostOffset, bytes.length);
            return newPostOffset;
        },
    }) as TEncoder;
}

/**
 * Moves the offset of a given decoder before and/or after decoding.
 *
 * This function allows a decoder to read its input from a different offset
 * than the one originally provided. It supports both pre-offset adjustments
 * (before decoding) and post-offset adjustments (after decoding).
 *
 * The pre-offset function determines where decoding should start, while the
 * post-offset function adjusts where the next decoder should continue reading.
 *
 * For more details, see {@link offsetCodec}.
 *
 * @typeParam TTo - The type of the decoded value.
 *
 * @param decoder - The decoder to adjust.
 * @param config - An object specifying how the offset should be modified.
 * @returns A new decoder with adjusted offsets.
 *
 * @example
 * Moving the pre-offset forward by 2 bytes.
 * ```ts
 * const decoder = offsetDecoder(getU32Decoder(), {
 *     preOffset: ({ preOffset }) => preOffset + 2,
 * });
 * const bytes = new Uint8Array([0, 0, 42, 0]); // Value starts at offset 2
 * decoder.read(bytes, 0); // Actually reads from offset 2
 * ```
 *
 * @example
 * Moving the post-offset forward by 2 bytes.
 * ```ts
 * const decoder = offsetDecoder(getU32Decoder(), {
 *     postOffset: ({ postOffset }) => postOffset + 2,
 * });
 * const bytes = new Uint8Array([42, 0, 0, 0]);
 * const [value, nextOffset] = decoder.read(bytes, 0); // Next decoder starts at offset 6 instead of 4
 * ```
 *
 * @example
 * Using `wrapBytes` to read from the last 4 bytes of an array.
 * ```ts
 * const decoder = offsetDecoder(getU32Decoder(), {
 *     preOffset: ({ wrapBytes }) => wrapBytes(-4), // Moves offset to last 4 bytes of the array
 * });
 * const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 42]); // Value stored at the last 4 bytes
 * decoder.read(bytes, 0); // Reads from bytes.length - 4
 * ```
 *
 * @remarks
 * If you need both encoding and decoding offsets to be adjusted, use {@link offsetCodec}.
 *
 * @see {@link offsetCodec}
 * @see {@link offsetEncoder}
 */
export function offsetDecoder<TDecoder extends AnyDecoder>(decoder: TDecoder, config: OffsetConfig): TDecoder {
    return createDecoder({
        ...decoder,
        read: (bytes, preOffset) => {
            const wrapBytes = (offset: Offset) => modulo(offset, bytes.length);
            const newPreOffset = config.preOffset ? config.preOffset({ bytes, preOffset, wrapBytes }) : preOffset;
            assertByteArrayOffsetIsNotOutOfRange('offsetDecoder', newPreOffset, bytes.length);
            const [value, postOffset] = decoder.read(bytes, newPreOffset);
            const newPostOffset = config.postOffset
                ? config.postOffset({ bytes, newPreOffset, postOffset, preOffset, wrapBytes })
                : postOffset;
            assertByteArrayOffsetIsNotOutOfRange('offsetDecoder', newPostOffset, bytes.length);
            return [value, newPostOffset];
        },
    }) as TDecoder;
}

/**
 * Moves the offset of a given codec before and/or after encoding and decoding.
 *
 * This function allows a codec to encode and decode values at custom offsets
 * within a byte array. It modifies both the **pre-offset** (where encoding/decoding starts)
 * and the **post-offset** (where the next operation should continue).
 *
 * This is particularly useful when working with structured binary formats
 * that require skipping reserved bytes, inserting padding, or aligning fields at
 * specific locations.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 *
 * @param codec - The codec to adjust.
 * @param config - An object specifying how the offset should be modified.
 * @returns A new codec with adjusted offsets.
 *
 * @example
 * Moving the pre-offset forward by 2 bytes when encoding and decoding.
 * ```ts
 * const codec = offsetCodec(getU32Codec(), {
 *     preOffset: ({ preOffset }) => preOffset + 2,
 * });
 * const bytes = new Uint8Array(10);
 * codec.write(42, bytes, 0); // Actually written at offset 2
 * codec.read(bytes, 0);      // Actually read from offset 2
 * ```
 *
 * @example
 * Moving the post-offset forward by 2 bytes when encoding and decoding.
 * ```ts
 * const codec = offsetCodec(getU32Codec(), {
 *     postOffset: ({ postOffset }) => postOffset + 2,
 * });
 * const bytes = new Uint8Array(10);
 * codec.write(42, bytes, 0);
 * // Next encoding starts at offset 6 instead of 4
 * codec.read(bytes, 0);
 * // Next decoding starts at offset 6 instead of 4
 * ```
 *
 * @example
 * Using `wrapBytes` to loop around negative offsets.
 * ```ts
 * const codec = offsetCodec(getU32Codec(), {
 *     preOffset: ({ wrapBytes }) => wrapBytes(-4), // Moves offset to last 4 bytes
 * });
 * const bytes = new Uint8Array(10);
 * codec.write(42, bytes, 0); // Writes at bytes.length - 4
 * codec.read(bytes, 0); // Reads from bytes.length - 4
 * ```
 *
 * @remarks
 * If you only need to adjust offsets for encoding, use {@link offsetEncoder}.
 * If you only need to adjust offsets for decoding, use {@link offsetDecoder}.
 *
 * ```ts
 * const bytes = new Uint8Array(10);
 * offsetEncoder(getU32Encoder(), { preOffset: ({ preOffset }) => preOffset + 2 }).write(42, bytes, 0);
 * const [value] = offsetDecoder(getU32Decoder(), { preOffset: ({ preOffset }) => preOffset + 2 }).read(bytes, 0);
 * ```
 *
 * @see {@link offsetEncoder}
 * @see {@link offsetDecoder}
 */
export function offsetCodec<TCodec extends AnyCodec>(codec: TCodec, config: OffsetConfig): TCodec {
    return combineCodec(offsetEncoder(codec, config), offsetDecoder(codec, config)) as TCodec;
}

/** A modulo function that handles negative dividends and zero divisors. */
function modulo(dividend: number, divisor: number) {
    if (divisor === 0) return 0;
    return ((dividend % divisor) + divisor) % divisor;
}
