import { Codec, createCodec, createDecoder, createEncoder, Decoder, Encoder, Offset } from './codec';
import { ReadonlyUint8Array } from './readonly-uint8array';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEncoder = Encoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDecoder = Decoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCodec = Codec<any>;

/**
 * Observes the encoded bytes of an encoder after it writes them, without modifying them.
 *
 * This function takes an existing encoder and returns a new encoder of the exact same type that
 * calls the provided `tap` function with the byte array after each value is written. The bytes are
 * provided as a {@link ReadonlyUint8Array} and are passed through unchanged, making this useful for
 * adding validation guards, logging, or other read-only side effects on the encoded bytes.
 *
 * The `tap` function receives the entire byte array alongside the offsets before and after the value
 * was written, so it can inspect the window `[preOffset, postOffset)` that was just encoded.
 *
 * If the `tap` function throws, the encoding is aborted and the error propagates to the caller.
 *
 * @typeParam TEncoder - The type of the encoder being tapped. The returned encoder has the same type.
 *
 * @param encoder - The encoder whose encoded bytes should be observed.
 * @param tap - A function called with the byte array and offsets after writing. It may throw to abort encoding.
 * @returns A new encoder of the same type that observes its encoded bytes.
 *
 * @throws Whatever error the `tap` function throws, aborting the encoding.
 *
 * @example
 * Observing the bytes written by a `u8` encoder.
 * ```ts
 * const encoder = tapEncoderBytes(getU8Encoder(), (bytes, preOffset, postOffset) => {
 *     console.log(bytes.slice(preOffset, postOffset));
 * });
 * ```
 *
 * @remarks
 * The tap fires after the encoder's `write` step. For variable-size encoders, this means the encoded
 * size is still computed from the value (via `getSizeFromValue`) *before* the tap runs, so a custom
 * `getSizeFromValue` that rejects the value will throw before the tap has a chance to.
 *
 * To observe the input value instead of the encoded bytes, use {@link tapEncoder}.
 *
 * @see {@link tapCodecBytes}
 * @see {@link tapDecoderBytes}
 * @see {@link tapEncoder}
 */
export function tapEncoderBytes<TEncoder extends AnyEncoder>(
    encoder: TEncoder,
    tap: (bytes: ReadonlyUint8Array, preOffset: Offset, postOffset: Offset) => void,
): TEncoder {
    return createEncoder({
        ...encoder,
        write: (value, bytes, offset) => {
            const postOffset = encoder.write(value, bytes, offset);
            tap(bytes, offset, postOffset);
            return postOffset;
        },
    }) as TEncoder;
}

/**
 * Observes the raw bytes of a decoder before it decodes them, without modifying them.
 *
 * This function takes an existing decoder and returns a new decoder of the exact same type that
 * calls the provided `tap` function with the byte array before each value is read. The bytes are
 * provided as a {@link ReadonlyUint8Array} and are passed through unchanged, making this useful for
 * adding validation guards, logging, or other read-only side effects on the raw bytes.
 *
 * If the `tap` function throws, the decoding is aborted and the error propagates to the caller.
 *
 * @typeParam TDecoder - The type of the decoder being tapped. The returned decoder has the same type.
 *
 * @param decoder - The decoder whose raw bytes should be observed.
 * @param tap - A function called with the byte array and offset before reading. It may throw to abort decoding.
 * @returns A new decoder of the same type that observes its raw bytes.
 *
 * @throws Whatever error the `tap` function throws, aborting the decoding.
 *
 * @example
 * Guarding the raw bytes of a boolean decoder.
 * ```ts
 * const decoder = tapDecoderBytes(getBooleanDecoder(), (bytes, offset) => {
 *     if (bytes[offset] > 1) throw new Error('Expected a 0 or a 1 for booleans');
 * });
 * decoder.decode(new Uint8Array([1])); // true
 * decoder.decode(new Uint8Array([2])); // Throws 'Expected a 0 or a 1 for booleans'
 * ```
 *
 * @remarks
 * To observe the decoded value instead of the raw bytes, use {@link tapDecoder}.
 *
 * @see {@link tapCodecBytes}
 * @see {@link tapEncoderBytes}
 * @see {@link tapDecoder}
 */
export function tapDecoderBytes<TDecoder extends AnyDecoder>(
    decoder: TDecoder,
    tap: (bytes: ReadonlyUint8Array, offset: Offset) => void,
): TDecoder {
    return createDecoder({
        ...decoder,
        read: (bytes, offset) => {
            tap(bytes, offset);
            return decoder.read(bytes, offset);
        },
    }) as TDecoder;
}

/**
 * Observes the raw bytes of a codec on both sides, without modifying them.
 *
 * This function takes an existing codec and returns a new codec of the exact same type that:
 * - Calls `encodeTap` with the byte array after each value is written.
 * - Calls `decodeTap` (if provided) with the byte array before each value is read.
 *
 * The bytes are provided as {@link ReadonlyUint8Array | ReadonlyUint8Arrays} and are passed through
 * unchanged, making this useful for adding validation guards, logging, or other read-only side effects.
 * If either tap function throws, the corresponding operation is aborted and the error propagates to
 * the caller.
 *
 * @typeParam TCodec - The type of the codec being tapped. The returned codec has the same type.
 *
 * @param codec - The codec whose raw bytes should be observed.
 * @param encodeTap - A function called with the byte array and offsets after writing. It may throw to abort encoding.
 * @param decodeTap - An optional function called with the byte array and offset before reading. It may throw to abort decoding.
 * @returns A new codec of the same type that observes its raw bytes.
 *
 * @throws Whatever error the tap functions throw, aborting the corresponding operation.
 *
 * @example
 * Guarding the raw bytes of a boolean codec before decoding.
 * ```ts
 * const codec = tapCodecBytes(
 *     getBooleanCodec(),
 *     () => {},
 *     (bytes, offset) => {
 *         if (bytes[offset] > 1) throw new Error('Expected a 0 or a 1 for booleans');
 *     },
 * );
 * ```
 *
 * @remarks
 * If only the encoded bytes need observing, use {@link tapEncoderBytes}.
 * If only the raw bytes before decoding need observing, use {@link tapDecoderBytes}.
 * To observe the values instead of the raw bytes, use {@link tapCodec}.
 *
 * @see {@link tapEncoderBytes}
 * @see {@link tapDecoderBytes}
 * @see {@link tapCodec}
 */
export function tapCodecBytes<TCodec extends AnyCodec>(
    codec: TCodec,
    encodeTap: (bytes: ReadonlyUint8Array, preOffset: Offset, postOffset: Offset) => void,
    decodeTap?: (bytes: ReadonlyUint8Array, offset: Offset) => void,
): TCodec {
    return createCodec({
        ...codec,
        read: decodeTap
            ? (bytes, offset) => {
                  decodeTap(bytes, offset);
                  return codec.read(bytes, offset);
              }
            : codec.read,
        write: (value, bytes, offset) => {
            const postOffset = codec.write(value, bytes, offset);
            encodeTap(bytes, offset, postOffset);
            return postOffset;
        },
    }) as TCodec;
}
