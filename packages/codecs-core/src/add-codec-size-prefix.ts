import { assertByteArrayHasEnoughBytesForCodec } from './assertions';
import {
    Codec,
    createDecoder,
    createEncoder,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    getEncodedSize,
    isFixedSize,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from './codec';
import { combineCodec } from './combine-codec';

type NumberEncoder = Encoder<bigint | number> | Encoder<number>;
type FixedSizeNumberEncoder<TSize extends number = number> =
    | FixedSizeEncoder<bigint | number, TSize>
    | FixedSizeEncoder<number, TSize>;
type NumberDecoder = Decoder<bigint> | Decoder<number>;
type FixedSizeNumberDecoder<TSize extends number = number> =
    | FixedSizeDecoder<bigint, TSize>
    | FixedSizeDecoder<number, TSize>;
type NumberCodec = Codec<bigint | number, bigint> | Codec<number>;
type FixedSizeNumberCodec<TSize extends number = number> =
    | FixedSizeCodec<bigint | number, bigint, TSize>
    | FixedSizeCodec<number, number, TSize>;

/**
 * Stores the size of the `encoder` in bytes as a prefix using the `prefix` encoder.
 *
 * See {@link addCodecSizePrefix} for more information.
 *
 * @typeParam TFrom - The type of the value to encode.
 *
 * @see {@link addCodecSizePrefix}
 */
export function addEncoderSizePrefix<TFrom>(
    encoder: FixedSizeEncoder<TFrom>,
    prefix: FixedSizeNumberEncoder,
): FixedSizeEncoder<TFrom>;
export function addEncoderSizePrefix<TFrom>(encoder: Encoder<TFrom>, prefix: NumberEncoder): VariableSizeEncoder<TFrom>;
export function addEncoderSizePrefix<TFrom>(encoder: Encoder<TFrom>, prefix: NumberEncoder): Encoder<TFrom> {
    const write = ((value, bytes, offset) => {
        // Here we exceptionally use the `encode` function instead of the `write`
        // function to contain the content of the encoder within its own bounds.
        const encoderBytes = encoder.encode(value);
        offset = prefix.write(encoderBytes.length, bytes, offset);
        bytes.set(encoderBytes, offset);
        return offset + encoderBytes.length;
    }) as Encoder<TFrom>['write'];

    if (isFixedSize(prefix) && isFixedSize(encoder)) {
        return createEncoder({ ...encoder, fixedSize: prefix.fixedSize + encoder.fixedSize, write });
    }

    const prefixMaxSize = isFixedSize(prefix) ? prefix.fixedSize : (prefix.maxSize ?? null);
    const encoderMaxSize = isFixedSize(encoder) ? encoder.fixedSize : (encoder.maxSize ?? null);
    const maxSize = prefixMaxSize !== null && encoderMaxSize !== null ? prefixMaxSize + encoderMaxSize : null;

    return createEncoder({
        ...encoder,
        ...(maxSize !== null ? { maxSize } : {}),
        getSizeFromValue: value => {
            const encoderSize = getEncodedSize(value, encoder);
            return getEncodedSize(encoderSize, prefix) + encoderSize;
        },
        write,
    });
}

/**
 * Bounds the size of the nested `decoder` by reading its encoded `prefix`.
 *
 * See {@link addCodecSizePrefix} for more information.
 *
 * @typeParam TTo - The type of the decoded value.
 *
 * @see {@link addCodecSizePrefix}
 */
export function addDecoderSizePrefix<TTo>(
    decoder: FixedSizeDecoder<TTo>,
    prefix: FixedSizeNumberDecoder,
): FixedSizeDecoder<TTo>;
export function addDecoderSizePrefix<TTo>(decoder: Decoder<TTo>, prefix: NumberDecoder): VariableSizeDecoder<TTo>;
export function addDecoderSizePrefix<TTo>(decoder: Decoder<TTo>, prefix: NumberDecoder): Decoder<TTo> {
    const read = ((bytes, offset) => {
        const [bigintSize, decoderOffset] = prefix.read(bytes, offset);
        const size = Number(bigintSize);
        offset = decoderOffset;
        // Slice the byte array to the contained size if necessary.
        if (offset > 0 || bytes.length > size) {
            bytes = bytes.slice(offset, offset + size);
        }
        assertByteArrayHasEnoughBytesForCodec('addDecoderSizePrefix', size, bytes);
        // Here we exceptionally use the `decode` function instead of the `read`
        // function to contain the content of the decoder within its own bounds.
        return [decoder.decode(bytes), offset + size];
    }) as Decoder<TTo>['read'];

    if (isFixedSize(prefix) && isFixedSize(decoder)) {
        return createDecoder({ ...decoder, fixedSize: prefix.fixedSize + decoder.fixedSize, read });
    }

    const prefixMaxSize = isFixedSize(prefix) ? prefix.fixedSize : (prefix.maxSize ?? null);
    const decoderMaxSize = isFixedSize(decoder) ? decoder.fixedSize : (decoder.maxSize ?? null);
    const maxSize = prefixMaxSize !== null && decoderMaxSize !== null ? prefixMaxSize + decoderMaxSize : null;
    return createDecoder({ ...decoder, ...(maxSize !== null ? { maxSize } : {}), read });
}

/**
 * Stores the byte size of any given codec as an encoded number prefix.
 *
 * This sets a limit on variable-size codecs and tells us when to stop decoding.
 * When encoding, the size of the encoded data is stored before the encoded data itself.
 * When decoding, the size is read first to know how many bytes to read next.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 *
 * @example
 * For example, say we want to bound a variable-size base-58 string using a `u32` size prefix.
 * Here’s how you can use the `addCodecSizePrefix` function to achieve that.
 *
 * ```ts
 * const getU32Base58Codec = () => addCodecSizePrefix(getBase58Codec(), getU32Codec());
 *
 * getU32Base58Codec().encode('hello world');
 * // 0x0b00000068656c6c6f20776f726c64
 * //   |       └-- Our encoded base-58 string.
 * //   └-- Our encoded u32 size prefix.
 * ```
 *
 * @remarks
 * Separate {@link addEncoderSizePrefix} and {@link addDecoderSizePrefix} functions are also available.
 *
 * ```ts
 * const bytes = addEncoderSizePrefix(getBase58Encoder(), getU32Encoder()).encode('hello');
 * const value = addDecoderSizePrefix(getBase58Decoder(), getU32Decoder()).decode(bytes);
 * ```
 *
 * @see {@link addEncoderSizePrefix}
 * @see {@link addDecoderSizePrefix}
 */
export function addCodecSizePrefix<TFrom, TTo extends TFrom>(
    codec: FixedSizeCodec<TFrom, TTo>,
    prefix: FixedSizeNumberCodec,
): FixedSizeCodec<TFrom, TTo>;
export function addCodecSizePrefix<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
    prefix: NumberCodec,
): VariableSizeCodec<TFrom, TTo>;
export function addCodecSizePrefix<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
    prefix: NumberCodec,
): Codec<TFrom, TTo> {
    return combineCodec(addEncoderSizePrefix(codec, prefix), addDecoderSizePrefix(codec, prefix));
}
