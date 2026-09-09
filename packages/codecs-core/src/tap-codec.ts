import { Codec, createCodec, createDecoder, createEncoder, Decoder, Encoder } from './codec';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEncoder = Encoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDecoder = Decoder<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCodec = Codec<any>;

/**
 * Observes the input value of an encoder before it is encoded, without modifying it.
 *
 * This function takes an existing encoder and returns a new encoder of the exact same type that
 * calls the provided `tap` function with each value before delegating to the original encoder.
 * The value is passed through unchanged, making this useful for adding validation guards, logging,
 * or other read-only side effects on the input value.
 *
 * If the `tap` function throws, the encoding is aborted and the error propagates to the caller.
 *
 * @typeParam TEncoder - The type of the encoder being tapped. The returned encoder has the same type.
 *
 * @param encoder - The encoder whose input value should be observed.
 * @param tap - A function called with each value before encoding. It may throw to abort encoding.
 * @returns A new encoder of the same type that observes its input value before encoding.
 *
 * @throws Whatever error the `tap` function throws, aborting the encoding.
 *
 * @example
 * Guarding the input value of a `u8` encoder.
 * ```ts
 * const encoder = tapEncoder(getU8Encoder(), value => {
 *     if (value > 100) throw new Error('Value must not exceed 100');
 * });
 * encoder.encode(42); // 0x2a
 * encoder.encode(200); // Throws 'Value must not exceed 100'
 * ```
 *
 * @remarks
 * The tap fires from within the encoder's `write` step. For variable-size encoders, this means the
 * encoded size is computed from the unvalidated value (via `getSizeFromValue`) *before* the tap runs,
 * so a custom `getSizeFromValue` that rejects the value will throw before the tap has a chance to.
 *
 * To observe the encoded bytes instead of the input value, use {@link tapEncoderBytes}.
 *
 * @see {@link tapCodec}
 * @see {@link tapDecoder}
 * @see {@link tapEncoderBytes}
 */
export function tapEncoder<TEncoder extends AnyEncoder>(
    encoder: TEncoder,
    tap: (value: TEncoder extends Encoder<infer TFrom> ? TFrom : never) => void,
): TEncoder {
    return createEncoder({
        ...encoder,
        write: (value, bytes, offset) => {
            tap(value);
            return encoder.write(value, bytes, offset);
        },
    }) as TEncoder;
}

/**
 * Observes the decoded value of a decoder after it is decoded, without modifying it.
 *
 * This function takes an existing decoder and returns a new decoder of the exact same type that
 * calls the provided `tap` function with each decoded value before returning it. The value is
 * passed through unchanged, making this useful for adding validation guards, logging, or other
 * read-only side effects on the decoded value.
 *
 * If the `tap` function throws, the decoding is aborted and the error propagates to the caller.
 *
 * @typeParam TDecoder - The type of the decoder being tapped. The returned decoder has the same type.
 *
 * @param decoder - The decoder whose decoded value should be observed.
 * @param tap - A function called with each decoded value. It may throw to abort decoding.
 * @returns A new decoder of the same type that observes its decoded value.
 *
 * @throws Whatever error the `tap` function throws, aborting the decoding.
 *
 * @example
 * Guarding the decoded value of a `u8` decoder.
 * ```ts
 * const decoder = tapDecoder(getU8Decoder(), value => {
 *     if (value === 0) throw new Error('Value must not be zero');
 * });
 * decoder.decode(new Uint8Array([42])); // 42
 * decoder.decode(new Uint8Array([0])); // Throws 'Value must not be zero'
 * ```
 *
 * @remarks
 * To observe the raw bytes before decoding instead of the decoded value, use {@link tapDecoderBytes}.
 *
 * @see {@link tapCodec}
 * @see {@link tapEncoder}
 * @see {@link tapDecoderBytes}
 */
export function tapDecoder<TDecoder extends AnyDecoder>(
    decoder: TDecoder,
    tap: (value: TDecoder extends Decoder<infer TTo> ? TTo : never) => void,
): TDecoder {
    return createDecoder({
        ...decoder,
        read: (bytes, offset) => {
            const [value, newOffset] = decoder.read(bytes, offset);
            tap(value);
            return [value, newOffset];
        },
    }) as TDecoder;
}

/**
 * Observes the values of a codec on both sides, without modifying them.
 *
 * This function takes an existing codec and returns a new codec of the exact same type that:
 * - Calls `encodeTap` with each value before encoding it.
 * - Calls `decodeTap` (if provided) with each decoded value after decoding it.
 *
 * Values are passed through unchanged, making this useful for adding validation guards, logging,
 * or other read-only side effects. If either tap function throws, the corresponding operation is
 * aborted and the error propagates to the caller.
 *
 * @typeParam TCodec - The type of the codec being tapped. The returned codec has the same type.
 *
 * @param codec - The codec whose values should be observed.
 * @param encodeTap - A function called with each value before encoding. It may throw to abort encoding.
 * @param decodeTap - An optional function called with each decoded value. It may throw to abort decoding.
 * @returns A new codec of the same type that observes its values.
 *
 * @throws Whatever error the tap functions throw, aborting the corresponding operation.
 *
 * @example
 * Guarding both the encoded and decoded values of a `u8` codec.
 * ```ts
 * const codec = tapCodec(
 *     getU8Codec(),
 *     value => {
 *         if (value > 100) throw new Error('Value must not exceed 100');
 *     },
 *     value => {
 *         if (value === 0) throw new Error('Value must not be zero');
 *     },
 * );
 * ```
 *
 * @remarks
 * If only the input value needs observing, use {@link tapEncoder}.
 * If only the decoded value needs observing, use {@link tapDecoder}.
 * To observe the raw bytes instead of the values, use {@link tapCodecBytes}.
 *
 * @see {@link tapEncoder}
 * @see {@link tapDecoder}
 * @see {@link tapCodecBytes}
 */
export function tapCodec<TCodec extends AnyCodec>(
    codec: TCodec,
    encodeTap: (value: TCodec extends Encoder<infer TFrom> ? TFrom : never) => void,
    decodeTap?: (value: TCodec extends Decoder<infer TTo> ? TTo : never) => void,
): TCodec {
    return createCodec({
        ...codec,
        read: decodeTap
            ? (bytes, offset) => {
                  const [value, newOffset] = codec.read(bytes, offset);
                  decodeTap(value);
                  return [value, newOffset];
              }
            : codec.read,
        write: (value, bytes, offset) => {
            encodeTap(value);
            return codec.write(value, bytes, offset);
        },
    }) as TCodec;
}
