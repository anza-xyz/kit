import {
    SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH,
    SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH,
    SolanaError,
} from '@solana/errors';

import { ReadonlyUint8Array } from './readonly-uint8array';

/**
 * Defines an offset in bytes.
 */
export type Offset = number;

/**
 * An object that can encode a value of type {@link TFrom} into a {@link ReadonlyUint8Array}.
 *
 * This is a common interface for {@link FixedSizeEncoder} and {@link VariableSizeEncoder}.
 *
 * @interface
 * @typeParam TFrom - The type of the value to encode.
 *
 * @see {@link FixedSizeEncoder}
 * @see {@link VariableSizeEncoder}
 */
type BaseEncoder<TFrom> = {
    /** Encode the provided value and return the encoded bytes directly. */
    readonly encode: (value: TFrom) => ReadonlyUint8Array;
    /**
     * Writes the encoded value into the provided byte array at the given offset.
     * Returns the offset of the next byte after the encoded value.
     */
    readonly write: (value: TFrom, bytes: Uint8Array, offset: Offset) => Offset;
};

/**
 * An object that can encode a value of type {@link TFrom} into a fixed-size {@link ReadonlyUint8Array}.
 *
 * See {@link Encoder} to learn more about creating and composing encoders.
 *
 * @interface
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 *
 * @example
 * ```ts
 * const encoder: FixedSizeEncoder<number, 4>;
 * const bytes = encoder.encode(42);
 * const size = encoder.fixedSize; // 4
 * ```
 *
 * @see {@link Encoder}
 * @see {@link VariableSizeEncoder}
 */
export type FixedSizeEncoder<TFrom, TSize extends number = number> = BaseEncoder<TFrom> & {
    /** The fixed size of the encoded value in bytes. */
    readonly fixedSize: TSize;
};

/**
 * An object that can encode a value of type {@link TFrom} into a variable-size {@link ReadonlyUint8Array}.
 *
 * See {@link Encoder} to learn more about creating and composing encoders.
 *
 * @interface
 * @typeParam TFrom - The type of the value to encode.
 *
 * @example
 * ```ts
 * const encoder: VariableSizeEncoder<string>;
 * const bytes = encoder.encode('hello');
 * const size = encoder.getSizeFromValue('hello');
 * ```
 *
 * @see {@link Encoder}
 * @see {@link FixedSizeEncoder}
 */
export type VariableSizeEncoder<TFrom> = BaseEncoder<TFrom> & {
    /** Returns the size of the encoded value in bytes for a given input. */
    readonly getSizeFromValue: (value: TFrom) => number;
    /** The maximum possible size of an encoded value in bytes, if applicable. */
    readonly maxSize?: number;
};

/**
 * An object that can encode a value of type {@link TFrom} into a {@link ReadonlyUint8Array}.
 *
 * An `Encoder` can be either:
 * - A {@link FixedSizeEncoder}, where all encoded values have the same fixed size.
 * - A {@link VariableSizeEncoder}, where encoded values can vary in size.
 *
 * @typeParam TFrom - The type of the value to encode.
 *
 * @example
 * Encoding a value into a new byte array.
 * ```ts
 * const encoder: Encoder<string>;
 * const bytes = encoder.encode('hello');
 * ```
 *
 * @example
 * Writing the encoded value into an existing byte array.
 * ```ts
 * const encoder: Encoder<string>;
 * const bytes = new Uint8Array(100);
 * const nextOffset = encoder.write('hello', bytes, 20);
 * ```
 *
 * @remarks
 * You may create `Encoders` manually using the {@link createEncoder} function but it is more common
 * to compose multiple `Encoders` together using the various helpers of the `@solana/codecs` package.
 *
 * For instance, here's how you might create an `Encoder` for a `Person` object type that contains
 * a `name` string and an `age` number:
 *
 * ```ts
 * import { getStructEncoder, addEncoderSizePrefix, getUtf8Encoder, getU32Encoder } from '@solana/codecs';
 *
 * type Person = { name: string; age: number };
 * const getPersonEncoder = (): Encoder<Person> =>
 *     getStructEncoder([
 *         ['name', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
 *         ['age', getU32Encoder()],
 *     ]);
 * ```
 *
 * Note that composed `Encoder` types are clever enough to understand whether
 * they are fixed-size or variable-size. In the example above, `getU32Encoder()` is
 * a fixed-size encoder, while `addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())`
 * is a variable-size encoder. This makes the final `Person` encoder a variable-size encoder.
 *
 * @see {@link FixedSizeEncoder}
 * @see {@link VariableSizeEncoder}
 * @see {@link createEncoder}
 */
export type Encoder<TFrom> = FixedSizeEncoder<TFrom> | VariableSizeEncoder<TFrom>;

/**
 * An object that can decode a byte array into a value of type {@link TTo}.
 *
 * This is a common interface for {@link FixedSizeDecoder} and {@link VariableSizeDecoder}.
 *
 * @interface
 * @typeParam TTo - The type of the decoded value.
 *
 * @see {@link FixedSizeDecoder}
 * @see {@link VariableSizeDecoder}
 */
type BaseDecoder<TTo> = {
    /** Decodes the provided byte array at the given offset (or zero) and returns the value directly. */
    readonly decode: (bytes: ReadonlyUint8Array | Uint8Array, offset?: Offset) => TTo;
    /**
     * Reads the encoded value from the provided byte array at the given offset.
     * Returns the decoded value and the offset of the next byte after the encoded value.
     */
    readonly read: (bytes: ReadonlyUint8Array | Uint8Array, offset: Offset) => [TTo, Offset];
};

/**
 * An object that can decode a fixed-size byte array into a value of type {@link TTo}.
 *
 * See {@link Decoder} to learn more about creating and composing decoders.
 *
 * @interface
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 *
 * @example
 * ```ts
 * const decoder: FixedSizeDecoder<number, 4>;
 * const value = decoder.decode(bytes);
 * const size = decoder.fixedSize; // 4
 * ```
 *
 * @see {@link Decoder}
 * @see {@link VariableSizeDecoder}
 */
export type FixedSizeDecoder<TTo, TSize extends number = number> = BaseDecoder<TTo> & {
    /** The fixed size of the encoded value in bytes. */
    readonly fixedSize: TSize;
};

/**
 * An object that can decode a variable-size byte array into a value of type {@link TTo}.
 *
 * See {@link Decoder} to learn more about creating and composing decoders.
 *
 * @interface
 * @typeParam TTo - The type of the decoded value.
 *
 * @example
 * ```ts
 * const decoder: VariableSizeDecoder<number>;
 * const value = decoder.decode(bytes);
 * ```
 *
 * @see {@link Decoder}
 * @see {@link VariableSizeDecoder}
 */
export type VariableSizeDecoder<TTo> = BaseDecoder<TTo> & {
    /** The maximum possible size of an encoded value in bytes, if applicable. */
    readonly maxSize?: number;
};

/**
 * An object that can decode a byte array into a value of type {@link TTo}.
 *
 * An `Decoder` can be either:
 * - A {@link FixedSizeDecoder}, where all byte arrays have the same fixed size.
 * - A {@link VariableSizeDecoder}, where byte arrays can vary in size.
 *
 * @typeParam TTo - The type of the decoded value.
 *
 * @example
 * Getting the decoded value from a byte array.
 * ```ts
 * const decoder: Decoder<string>;
 * const value = decoder.decode(bytes);
 * ```
 *
 * @example
 * Reading the decoded value from a byte array at a specific offset
 * and getting the offset of the next byte to read.
 * ```ts
 * const decoder: Decoder<string>;
 * const [value, nextOffset] = decoder.read('hello', bytes, 20);
 * ```
 *
 * @remarks
 * You may create `Decoders` manually using the {@link createDecoder} function but it is more common
 * to compose multiple `Decoders` together using the various helpers of the `@solana/codecs` package.
 *
 * For instance, here's how you might create an `Decoder` for a `Person` object type that contains
 * a `name` string and an `age` number:
 *
 * ```ts
 * import { getStructDecoder, addDecoderSizePrefix, getUtf8Decoder, getU32Decoder } from '@solana/codecs';
 *
 * type Person = { name: string; age: number };
 * const getPersonDecoder = (): Decoder<Person> =>
 *     getStructDecoder([
 *         ['name', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
 *         ['age', getU32Decoder()],
 *     ]);
 * ```
 *
 * Note that composed `Decoder` types are clever enough to understand whether
 * they are fixed-size or variable-size. In the example above, `getU32Decoder()` is
 * a fixed-size decoder, while `addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())`
 * is a variable-size decoder. This makes the final `Person` decoder a variable-size decoder.
 *
 * @see {@link FixedSizeDecoder}
 * @see {@link VariableSizeDecoder}
 * @see {@link createDecoder}
 */
export type Decoder<TTo> = FixedSizeDecoder<TTo> | VariableSizeDecoder<TTo>;

/**
 * An object that can encode and decode a value to and from a fixed-size byte array.
 *
 * See {@link Codec} to learn more about creating and composing codecs.
 *
 * @interface
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 *
 * @example
 * ```ts
 * const codec: FixedSizeCodec<number | bigint, bigint, 8>;
 * const bytes = codec.encode(42);
 * const value = codec.decode(bytes); // 42n
 * const size = codec.fixedSize; // 8
 * ```
 *
 * @see {@link Codec}
 * @see {@link VariableSizeCodec}
 */
export type FixedSizeCodec<TFrom, TTo extends TFrom = TFrom, TSize extends number = number> = FixedSizeDecoder<
    TTo,
    TSize
> &
    FixedSizeEncoder<TFrom, TSize>;

/**
 * An object that can encode and decode a value to and from a variable-size byte array.
 *
 * See {@link Codec} to learn more about creating and composing codecs.
 *
 * @interface
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 *
 * @example
 * ```ts
 * const codec: VariableSizeCodec<number | bigint, bigint>;
 * const bytes = codec.encode(42);
 * const value = codec.decode(bytes); // 42n
 * const size = codec.getSizeFromValue(42);
 * ```
 *
 * @see {@link Codec}
 * @see {@link FixedSizeCodec}
 */
export type VariableSizeCodec<TFrom, TTo extends TFrom = TFrom> = VariableSizeDecoder<TTo> & VariableSizeEncoder<TFrom>;

/**
 * An object that can encode and decode a value to and from a byte array.
 *
 * A `Codec` can be either:
 * - A {@link FixedSizeCodec}, where all encoded values have the same fixed size.
 * - A {@link VariableSizeCodec}, where encoded values can vary in size.
 *
 * @example
 * ```ts
 * const codec: Codec<string>;
 * const bytes = codec.encode('hello');
 * const value = codec.decode(bytes); // 'hello'
 * ```
 *
 * @remarks
 * For convenience, codecs can encode looser types than they decode.
 * That is, type {@link TFrom} can be a superset of type {@link TTo}.
 * For instance, a `Codec<bigint | number, bigint>` can encode both
 * `bigint` and `number` values, but will always decode to a `bigint`.
 *
 * ```ts
 * const codec: Codec<bigint | number, bigint>;
 * const bytes = codec.encode(42);
 * const value = codec.decode(bytes); // 42n
 * ```
 *
 * It is worth noting that codecs are the union of encoders and decoders.
 * This means that a `Codec<TFrom, TTo>` can be combined from an `Encoder<TFrom>`
 * and a `Decoder<TTo>` using the {@link combineCodec} function. This is particularly
 * useful for library authors who want to expose all three types of objects to their users.
 *
 * ```ts
 * const encoder: Encoder<bigint | number>;
 * const decoder: Decoder<bigint>;
 * const codec: Codec<bigint | number, bigint> = combineCodec(encoder, decoder);
 * ```
 *
 * Aside from combining encoders and decoders, codecs can also be created from scratch using
 * the {@link createCodec} function but it is more common to compose multiple codecs together
 * using the various helpers of the `@solana/codecs` package.
 *
 * For instance, here's how you might create a `Codec` for a `Person` object type that contains
 * a `name` string and an `age` number:
 *
 * ```ts
 * import { getStructCodec, addCodecSizePrefix, getUtf8Codec, getU32Codec } from '@solana/codecs';
 *
 * type Person = { name: string; age: number };
 * const getPersonCodec = (): Codec<Person> =>
 *     getStructCodec([
 *         ['name', addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
 *         ['age', getU32Codec()],
 *     ]);
 * ```
 *
 * Note that composed `Codec` types are clever enough to understand whether
 * they are fixed-size or variable-size. In the example above, `getU32Codec()` is
 * a fixed-size codec, while `addCodecSizePrefix(getUtf8Codec(), getU32Codec())`
 * is a variable-size codec. This makes the final `Person` codec a variable-size codec.
 *
 * @see {@link FixedSizeCodec}
 * @see {@link VariableSizeCodec}
 * @see {@link combineCodec}
 * @see {@link createCodec}
 */
export type Codec<TFrom, TTo extends TFrom = TFrom> = FixedSizeCodec<TFrom, TTo> | VariableSizeCodec<TFrom, TTo>;

/**
 * Gets the encoded size of a given value in bytes using the provided encoder.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @param value - The value to be encoded.
 * @param encoder - The encoder used to determine the encoded size.
 * @returns The size of the encoded value in bytes.
 *
 * @example
 * ```ts
 * const fixedSizeEncoder = { fixedSize: 4 };
 * getEncodedSize(123, fixedSizeEncoder); // Returns 4.
 *
 * const variableSizeEncoder = { getSizeFromValue: (value: string) => value.length };
 * getEncodedSize("hello", variableSizeEncoder); // Returns 5.
 * ```
 *
 * @see {@link Encoder}
 */
export function getEncodedSize<TFrom>(
    value: TFrom,
    encoder: { fixedSize: number } | { getSizeFromValue: (value: TFrom) => number },
): number {
    return 'fixedSize' in encoder ? encoder.fixedSize : encoder.getSizeFromValue(value);
}

/**
 * Creates an `Encoder` by filling in the missing `encode` function using the provided `write` function and
 * either the `fixedSize` property (for {@link FixedSizeEncoder | FixedSizeEncoders}) or
 * the `getSizeFromValue` function (for {@link VariableSizeEncoder | VariableSizeEncoders}).
 *
 * Instead of manually implementing `encode`, this utility leverages the existing `write` function
 * and the size helpers to generate a complete encoder. The provided `encode` method will allocate
 * a new `Uint8Array` of the correct size and use `write` to populate it.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TSize - The fixed size of the encoded value in bytes (for fixed-size encoders).
 *
 * @param encoder - An encoder object that implements `write`, but not `encode`.
 * - If the encoder has a `fixedSize` property, it is treated as a {@link FixedSizeEncoder}.
 * - Otherwise, it is treated as a {@link VariableSizeEncoder}.
 *
 * @returns A fully functional `Encoder` with both `write` and `encode` methods.
 *
 * @example
 * Creating a custom fixed-size encoder.
 * ```ts
 * const encoder = createEncoder({
 *     fixedSize: 4,
 *     write: (value: number, bytes, offset) => {
 *         bytes.set(new Uint8Array([value]), offset);
 *         return offset + 4;
 *     },
 * });
 *
 * const bytes = encoder.encode(42);
 * // 0x2a000000
 * ```
 *
 * @example
 * Creating a custom variable-size encoder:
 * ```ts
 * const encoder = createEncoder({
 *     getSizeFromValue: (value: string) => value.length,
 *     write: (value: string, bytes, offset) => {
 *         const encodedValue = new TextEncoder().encode(value);
 *         bytes.set(encodedValue, offset);
 *         return offset + encodedValue.length;
 *     },
 * });
 *
 * const bytes = encoder.encode("hello");
 * // 0x68656c6c6f
 * ```
 *
 * @remarks
 * Note that, while `createEncoder` is useful for defining more complex encoders, it is more common to compose
 * encoders together using the various helpers and primitives of the `@solana/codecs` package.
 *
 * Here are some alternative examples using codec primitives instead of `createEncoder`.
 *
 * ```ts
 * // Fixed-size encoder for unsigned 32-bit integers.
 * const encoder = getU32Encoder();
 * const bytes = encoder.encode(42);
 * // 0x2a000000
 *
 * // Variable-size encoder for 32-bytes prefixed UTF-8 strings.
 * const encoder = addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
 * const bytes = encoder.encode("hello");
 * // 0x0500000068656c6c6f
 *
 * // Variable-size encoder for custom objects.
 * type Person = { name: string; age: number };
 * const encoder: Encoder<Person> = getStructEncoder([
 *     ['name', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
 *     ['age', getU32Encoder()],
 * ]);
 * const bytes = encoder.encode({ name: "Bob", age: 42 });
 * // 0x03000000426f622a000000
 * ```
 *
 * @see {@link Encoder}
 * @see {@link FixedSizeEncoder}
 * @see {@link VariableSizeEncoder}
 * @see {@link getStructEncoder}
 * @see {@link getU32Encoder}
 * @see {@link getUtf8Encoder}
 * @see {@link addEncoderSizePrefix}
 */
export function createEncoder<TFrom, TSize extends number>(
    encoder: Omit<FixedSizeEncoder<TFrom, TSize>, 'encode'>,
): FixedSizeEncoder<TFrom, TSize>;
export function createEncoder<TFrom>(encoder: Omit<VariableSizeEncoder<TFrom>, 'encode'>): VariableSizeEncoder<TFrom>;
export function createEncoder<TFrom>(
    encoder: Omit<FixedSizeEncoder<TFrom>, 'encode'> | Omit<VariableSizeEncoder<TFrom>, 'encode'>,
): Encoder<TFrom>;
export function createEncoder<TFrom>(
    encoder: Omit<FixedSizeEncoder<TFrom>, 'encode'> | Omit<VariableSizeEncoder<TFrom>, 'encode'>,
): Encoder<TFrom> {
    return Object.freeze({
        ...encoder,
        encode: value => {
            const bytes = new Uint8Array(getEncodedSize(value, encoder));
            encoder.write(value, bytes, 0);
            return bytes;
        },
    });
}

/**
 * Creates a `Decoder` by filling in the missing `decode` function using the provided `read` function.
 *
 * Instead of manually implementing `decode`, this utility leverages the existing `read` function
 * and the size properties to generate a complete decoder. The provided `decode` method will read
 * from a `Uint8Array` at the given offset and return the decoded value.
 *
 * If the `fixedSize` property is provided, a {@link FixedSizeDecoder} will be created, otherwise
 * a {@link VariableSizeDecoder} will be created.
 *
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes (for fixed-size decoders).
 *
 * @param decoder - A decoder object that implements `read`, but not `decode`.
 * - If the decoder has a `fixedSize` property, it is treated as a {@link FixedSizeDecoder}.
 * - Otherwise, it is treated as a {@link VariableSizeDecoder}.
 *
 * @returns A fully functional `Decoder` with both `read` and `decode` methods.
 *
 * @example
 * Creating a custom fixed-size decoder.
 * ```ts
 * const decoder = createDecoder({
 *     fixedSize: 4,
 *     read: (bytes, offset) => {
 *         const value = bytes[offset];
 *         return [value, offset + 4];
 *     },
 * });
 *
 * const value = decoder.decode(new Uint8Array([42, 0, 0, 0]));
 * // 42
 * ```
 *
 * @example
 * Creating a custom variable-size decoder:
 * ```ts
 * const decoder = createDecoder({
 *     read: (bytes, offset) => {
 *         const decodedValue = new TextDecoder().decode(bytes.subarray(offset));
 *         return [decodedValue, bytes.length];
 *     },
 * });
 *
 * const value = decoder.decode(new Uint8Array([104, 101, 108, 108, 111]));
 * // "hello"
 * ```
 *
 * @remarks
 * Note that, while `createDecoder` is useful for defining more complex decoders, it is more common to compose
 * decoders together using the various helpers and primitives of the `@solana/codecs` package.
 *
 * Here are some alternative examples using codec primitives instead of `createDecoder`.
 *
 * ```ts
 * // Fixed-size decoder for unsigned 32-bit integers.
 * const decoder = getU32Decoder();
 * const value = decoder.decode(new Uint8Array([42, 0, 0, 0]));
 * // 42
 *
 * // Variable-size decoder for 32-bytes prefixed UTF-8 strings.
 * const decoder = addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder());
 * const value = decoder.decode(new Uint8Array([5, 0, 0, 0, 104, 101, 108, 108, 111]));
 * // "hello"
 *
 * // Variable-size decoder for custom objects.
 * type Person = { name: string; age: number };
 * const decoder: Decoder<Person> = getStructDecoder([
 *     ['name', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
 *     ['age', getU32Decoder()],
 * ]);
 * const value = decoder.decode(new Uint8Array([3, 0, 0, 0, 66, 111, 98, 42, 0, 0, 0]));
 * // { name: "Bob", age: 42 }
 * ```
 *
 * @see {@link Decoder}
 * @see {@link FixedSizeDecoder}
 * @see {@link VariableSizeDecoder}
 * @see {@link getStructDecoder}
 * @see {@link getU32Decoder}
 * @see {@link getUtf8Decoder}
 * @see {@link addDecoderSizePrefix}
 */
export function createDecoder<TTo, TSize extends number>(
    decoder: Omit<FixedSizeDecoder<TTo, TSize>, 'decode'>,
): FixedSizeDecoder<TTo, TSize>;
export function createDecoder<TTo>(decoder: Omit<VariableSizeDecoder<TTo>, 'decode'>): VariableSizeDecoder<TTo>;
export function createDecoder<TTo>(
    decoder: Omit<FixedSizeDecoder<TTo>, 'decode'> | Omit<VariableSizeDecoder<TTo>, 'decode'>,
): Decoder<TTo>;
export function createDecoder<TTo>(
    decoder: Omit<FixedSizeDecoder<TTo>, 'decode'> | Omit<VariableSizeDecoder<TTo>, 'decode'>,
): Decoder<TTo> {
    return Object.freeze({
        ...decoder,
        decode: (bytes, offset = 0) => decoder.read(bytes, offset)[0],
    });
}

/**
 * Creates a `Codec` by filling in the missing `encode` and `decode` functions using the provided `write` and `read` functions.
 *
 * This utility combines the behavior of {@link createEncoder} and {@link createDecoder} to produce a fully functional `Codec`.
 * The `encode` method is derived from the `write` function, while the `decode` method is derived from the `read` function.
 *
 * If the `fixedSize` property is provided, a {@link FixedSizeCodec} will be created, otherwise
 * a {@link VariableSizeCodec} will be created.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes (for fixed-size codecs).
 *
 * @param codec - A codec object that implements `write` and `read`, but not `encode` or `decode`.
 * - If the codec has a `fixedSize` property, it is treated as a {@link FixedSizeCodec}.
 * - Otherwise, it is treated as a {@link VariableSizeCodec}.
 *
 * @returns A fully functional `Codec` with `write`, `read`, `encode`, and `decode` methods.
 *
 * @example
 * Creating a custom fixed-size codec.
 * ```ts
 * const codec = createCodec({
 *     fixedSize: 4,
 *     read: (bytes, offset) => {
 *         const value = bytes[offset];
 *         return [value, offset + 4];
 *     },
 *     write: (value: number, bytes, offset) => {
 *         bytes.set(new Uint8Array([value]), offset);
 *         return offset + 4;
 *     },
 * });
 *
 * const bytes = codec.encode(42);
 * // 0x2a000000
 * const value = codec.decode(bytes);
 * // 42
 * ```
 *
 * @example
 * Creating a custom variable-size codec:
 * ```ts
 * const codec = createCodec({
 *     getSizeFromValue: (value: string) => value.length,
 *     read: (bytes, offset) => {
 *         const decodedValue = new TextDecoder().decode(bytes.subarray(offset));
 *         return [decodedValue, bytes.length];
 *     },
 *     write: (value: string, bytes, offset) => {
 *         const encodedValue = new TextEncoder().encode(value);
 *         bytes.set(encodedValue, offset);
 *         return offset + encodedValue.length;
 *     },
 * });
 *
 * const bytes = codec.encode("hello");
 * // 0x68656c6c6f
 * const value = codec.decode(bytes);
 * // "hello"
 * ```
 *
 * @remarks
 * This function effectively combines the behavior of {@link createEncoder} and {@link createDecoder}.
 * If you only need to encode or decode (but not both), consider using those functions instead.
 *
 * Here are some alternative examples using codec primitives instead of `createCodec`.
 *
 * ```ts
 * // Fixed-size codec for unsigned 32-bit integers.
 * const codec = getU32Codec();
 * const bytes = codec.encode(42);
 * // 0x2a000000
 * const value = codec.decode(bytes);
 * // 42
 *
 * // Variable-size codec for 32-bytes prefixed UTF-8 strings.
 * const codec = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
 * const bytes = codec.encode("hello");
 * // 0x0500000068656c6c6f
 * const value = codec.decode(bytes);
 * // "hello"
 *
 * // Variable-size codec for custom objects.
 * type Person = { name: string; age: number };
 * const codec: Codec<PersonInput, Person> = getStructCodec([
 *     ['name', addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
 *     ['age', getU32Codec()],
 * ]);
 * const bytes = codec.encode({ name: "Bob", age: 42 });
 * // 0x03000000426f622a000000
 * const value = codec.decode(bytes);
 * // { name: "Bob", age: 42 }
 * ```
 *
 * @see {@link Codec}
 * @see {@link FixedSizeCodec}
 * @see {@link VariableSizeCodec}
 * @see {@link createEncoder}
 * @see {@link createDecoder}
 * @see {@link getStructCodec}
 * @see {@link getU32Codec}
 * @see {@link getUtf8Codec}
 * @see {@link addCodecSizePrefix}
 */
export function createCodec<TFrom, TTo extends TFrom = TFrom, TSize extends number = number>(
    codec: Omit<FixedSizeCodec<TFrom, TTo, TSize>, 'decode' | 'encode'>,
): FixedSizeCodec<TFrom, TTo, TSize>;
export function createCodec<TFrom, TTo extends TFrom = TFrom>(
    codec: Omit<VariableSizeCodec<TFrom, TTo>, 'decode' | 'encode'>,
): VariableSizeCodec<TFrom, TTo>;
export function createCodec<TFrom, TTo extends TFrom = TFrom>(
    codec:
        | Omit<FixedSizeCodec<TFrom, TTo>, 'decode' | 'encode'>
        | Omit<VariableSizeCodec<TFrom, TTo>, 'decode' | 'encode'>,
): Codec<TFrom, TTo>;
export function createCodec<TFrom, TTo extends TFrom = TFrom>(
    codec:
        | Omit<FixedSizeCodec<TFrom, TTo>, 'decode' | 'encode'>
        | Omit<VariableSizeCodec<TFrom, TTo>, 'decode' | 'encode'>,
): Codec<TFrom, TTo> {
    return Object.freeze({
        ...codec,
        decode: (bytes, offset = 0) => codec.read(bytes, offset)[0],
        encode: value => {
            const bytes = new Uint8Array(getEncodedSize(value, codec));
            codec.write(value, bytes, 0);
            return bytes;
        },
    });
}

/**
 * Determines whether the given codec, encoder, or decoder is fixed-size.
 *
 * A fixed-size object is identified by the presence of a `fixedSize` property.
 * If this property exists, the object is considered a {@link FixedSizeCodec},
 * {@link FixedSizeEncoder}, or {@link FixedSizeDecoder}.
 * Otherwise, it is assumed to be a {@link VariableSizeCodec},
 * {@link VariableSizeEncoder}, or {@link VariableSizeDecoder}.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 * @returns `true` if the object is fixed-size, `false` otherwise.
 *
 * @example
 * Checking a fixed-size encoder.
 * ```ts
 * const encoder = getU32Encoder();
 * isFixedSize(encoder); // true
 * ```
 *
 * @example
 * Checking a variable-size encoder.
 * ```ts
 * const encoder = addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
 * isFixedSize(encoder); // false
 * ```
 *
 * @remarks
 * This function is commonly used to distinguish between fixed-size and variable-size objects at runtime.
 * If you need to enforce this distinction with type assertions, consider using {@link assertIsFixedSize}.
 *
 * @see {@link assertIsFixedSize}
 */
export function isFixedSize<TFrom, TSize extends number>(
    encoder: FixedSizeEncoder<TFrom, TSize> | VariableSizeEncoder<TFrom>,
): encoder is FixedSizeEncoder<TFrom, TSize>;
export function isFixedSize<TTo, TSize extends number>(
    decoder: FixedSizeDecoder<TTo, TSize> | VariableSizeDecoder<TTo>,
): decoder is FixedSizeDecoder<TTo, TSize>;
export function isFixedSize<TFrom, TTo extends TFrom, TSize extends number>(
    codec: FixedSizeCodec<TFrom, TTo, TSize> | VariableSizeCodec<TFrom, TTo>,
): codec is FixedSizeCodec<TFrom, TTo, TSize>;
export function isFixedSize<TSize extends number>(
    codec: { fixedSize: TSize } | { maxSize?: number },
): codec is { fixedSize: TSize };
export function isFixedSize(codec: { fixedSize: number } | { maxSize?: number }): codec is { fixedSize: number } {
    return 'fixedSize' in codec && typeof codec.fixedSize === 'number';
}

/**
 * Asserts that the given codec, encoder, or decoder is fixed-size.
 *
 * If the object is not fixed-size (i.e., it lacks a `fixedSize` property),
 * this function throws a {@link SolanaError} with the code `SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH`.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 * @throws {SolanaError} If the object is not fixed-size.
 *
 * @example
 * Asserting a fixed-size encoder.
 * ```ts
 * const encoder = getU32Encoder();
 * assertIsFixedSize(encoder); // Passes
 * ```
 *
 * @example
 * Attempting to assert a variable-size encoder.
 * ```ts
 * const encoder = addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
 * assertIsFixedSize(encoder); // Throws SolanaError
 * ```
 *
 * @remarks
 * This function is the assertion-based counterpart of {@link isFixedSize}.
 * If you only need to check whether an object is fixed-size without throwing an error, use {@link isFixedSize} instead.
 *
 * @see {@link isFixedSize}
 */
export function assertIsFixedSize<TFrom, TSize extends number>(
    encoder: FixedSizeEncoder<TFrom, TSize> | VariableSizeEncoder<TFrom>,
): asserts encoder is FixedSizeEncoder<TFrom, TSize>;
export function assertIsFixedSize<TTo, TSize extends number>(
    decoder: FixedSizeDecoder<TTo, TSize> | VariableSizeDecoder<TTo>,
): asserts decoder is FixedSizeDecoder<TTo, TSize>;
export function assertIsFixedSize<TFrom, TTo extends TFrom, TSize extends number>(
    codec: FixedSizeCodec<TFrom, TTo, TSize> | VariableSizeCodec<TFrom, TTo>,
): asserts codec is FixedSizeCodec<TFrom, TTo, TSize>;
export function assertIsFixedSize<TSize extends number>(
    codec: { fixedSize: TSize } | { maxSize?: number },
): asserts codec is { fixedSize: TSize };
export function assertIsFixedSize(
    codec: { fixedSize: number } | { maxSize?: number },
): asserts codec is { fixedSize: number } {
    if (!isFixedSize(codec)) {
        throw new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH);
    }
}

/**
 * Determines whether the given codec, encoder, or decoder is variable-size.
 *
 * A variable-size object is identified by the absence of a `fixedSize` property.
 * If this property is missing, the object is considered a {@link VariableSizeCodec},
 * {@link VariableSizeEncoder}, or {@link VariableSizeDecoder}.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 * @returns `true` if the object is variable-size, `false` otherwise.
 *
 * @example
 * Checking a variable-size encoder.
 * ```ts
 * const encoder = addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
 * isVariableSize(encoder); // true
 * ```
 *
 * @example
 * Checking a fixed-size encoder.
 * ```ts
 * const encoder = getU32Encoder();
 * isVariableSize(encoder); // false
 * ```
 *
 * @remarks
 * This function is the inverse of {@link isFixedSize}.
 *
 * @see {@link isFixedSize}
 * @see {@link assertIsVariableSize}
 */
export function isVariableSize<TFrom>(encoder: Encoder<TFrom>): encoder is VariableSizeEncoder<TFrom>;
export function isVariableSize<TTo>(decoder: Decoder<TTo>): decoder is VariableSizeDecoder<TTo>;
export function isVariableSize<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
): codec is VariableSizeCodec<TFrom, TTo>;
export function isVariableSize(codec: { fixedSize: number } | { maxSize?: number }): codec is { maxSize?: number };
export function isVariableSize(codec: { fixedSize: number } | { maxSize?: number }): codec is { maxSize?: number } {
    return !isFixedSize(codec);
}

/**
 * Asserts that the given codec, encoder, or decoder is variable-size.
 *
 * If the object is not variable-size (i.e., it has a `fixedSize` property),
 * this function throws a {@link SolanaError} with the code `SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH`.
 *
 * @typeParam TFrom - The type of the value to encode.
 * @typeParam TTo - The type of the decoded value.
 * @typeParam TSize - The fixed size of the encoded value in bytes.
 * @throws {SolanaError} If the object is not variable-size.
 *
 * @example
 * Asserting a variable-size encoder.
 * ```ts
 * const encoder = addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
 * assertIsVariableSize(encoder); // Passes
 * ```
 *
 * @example
 * Attempting to assert a fixed-size encoder.
 * ```ts
 * const encoder = getU32Encoder();
 * assertIsVariableSize(encoder); // Throws SolanaError
 * ```
 *
 * @remarks
 * This function is the assertion-based counterpart of {@link isVariableSize}.
 * If you only need to check whether an object is variable-size without throwing an error, use {@link isVariableSize} instead.
 *
 * Also note that this function is the inverse of {@link assertIsFixedSize}.
 *
 * @see {@link isVariableSize}
 * @see {@link assertIsFixedSize}
 */
export function assertIsVariableSize<TFrom>(encoder: Encoder<TFrom>): asserts encoder is VariableSizeEncoder<TFrom>;
export function assertIsVariableSize<TTo>(decoder: Decoder<TTo>): asserts decoder is VariableSizeDecoder<TTo>;
export function assertIsVariableSize<TFrom, TTo extends TFrom>(
    codec: Codec<TFrom, TTo>,
): asserts codec is VariableSizeCodec<TFrom, TTo>;
export function assertIsVariableSize(
    codec: { fixedSize: number } | { maxSize?: number },
): asserts codec is { maxSize?: number };
export function assertIsVariableSize(
    codec: { fixedSize: number } | { maxSize?: number },
): asserts codec is { maxSize?: number } {
    if (!isVariableSize(codec)) {
        throw new SolanaError(SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH);
    }
}
