/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Codec,
    combineCodec,
    createDecoder,
    createEncoder,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    getEncodedSize,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import { DrainOuterGeneric, getFixedSize, getMaxSize, sumCodecSizes } from './utils';

/**
 * Represents a collection of named fields used in struct codecs.
 *
 * Each field is defined as a tuple containing:
 * - A string key representing the field name.
 * - A codec used to encode and decode the field's value.
 *
 * @typeParam T - The codec type used for each field.
 */
type Fields<T> = readonly (readonly [string, T])[];

type ArrayIndices<T extends readonly unknown[]> = Exclude<Partial<T>['length'], T['length']> & number;

/**
 * Infers the TypeScript type for an object that can be encoded using a struct codec.
 *
 * This type maps the provided field encoders to their corresponding values.
 *
 * @typeParam TFields - The fields of the struct, each paired with an encoder.
 */
type GetEncoderTypeFromFields<TFields extends Fields<Encoder<any>>> = DrainOuterGeneric<{
    [I in ArrayIndices<TFields> as TFields[I][0]]: TFields[I][1] extends Encoder<infer TFrom> ? TFrom : never;
}>;

/**
 * Infers the TypeScript type for an object that can be decoded using a struct codec.
 *
 * This type maps the provided field decoders to their corresponding values.
 *
 * @typeParam TFields - The fields of the struct, each paired with a decoder.
 */
type GetDecoderTypeFromFields<TFields extends Fields<Decoder<any>>> = DrainOuterGeneric<{
    [I in ArrayIndices<TFields> as TFields[I][0]]: TFields[I][1] extends Decoder<infer TTo> ? TTo : never;
}>;

/**
 * Returns an encoder for custom objects.
 *
 * This encoder serializes an object by encoding its fields sequentially,
 * using the provided field encoders.
 *
 * For more details, see {@link getStructCodec}.
 *
 * @typeParam TFields - The fields of the struct, each paired with an encoder.
 *
 * @param fields - The name and encoder of each field.
 * @returns A `FixedSizeEncoder` or `VariableSizeEncoder` for encoding custom objects.
 *
 * @example
 * Encoding a custom struct.
 * ```ts
 * const encoder = getStructEncoder([
 *   ['name', fixCodecSize(getUtf8Encoder(), 5)],
 *   ['age', getU8Encoder()]
 * ]);
 *
 * const bytes = encoder.encode({ name: 'Alice', age: 42 });
 * // 0x416c6963652a
 * //   |         └── Age (42)
 * //   └── Name ("Alice")
 * ```
 *
 * @see {@link getStructCodec}
 */
export function getStructEncoder<const TFields extends Fields<FixedSizeEncoder<any>>>(
    fields: TFields,
): FixedSizeEncoder<GetEncoderTypeFromFields<TFields>>;
export function getStructEncoder<const TFields extends Fields<Encoder<any>>>(
    fields: TFields,
): VariableSizeEncoder<GetEncoderTypeFromFields<TFields>>;
export function getStructEncoder<const TFields extends Fields<Encoder<any>>>(
    fields: TFields,
): Encoder<GetEncoderTypeFromFields<TFields>> {
    type TFrom = GetEncoderTypeFromFields<TFields>;
    const fieldCodecs = fields.map(([, codec]) => codec);
    const fixedSize = sumCodecSizes(fieldCodecs.map(getFixedSize));
    const maxSize = sumCodecSizes(fieldCodecs.map(getMaxSize)) ?? undefined;

    return createEncoder({
        ...(fixedSize === null
            ? {
                  getSizeFromValue: (value: TFrom) =>
                      fields
                          .map(([key, codec]) => getEncodedSize(value[key as keyof TFrom], codec))
                          .reduce((all, one) => all + one, 0),
                  maxSize,
              }
            : { fixedSize }),
        write: (struct: TFrom, bytes, offset) => {
            fields.forEach(([key, codec]) => {
                offset = codec.write(struct[key as keyof TFrom], bytes, offset);
            });
            return offset;
        },
    });
}

/**
 * Returns a decoder for custom objects.
 *
 * This decoder deserializes an object by decoding its fields sequentially,
 * using the provided field decoders.
 *
 * For more details, see {@link getStructCodec}.
 *
 * @typeParam TFields - The fields of the struct, each paired with a decoder.
 *
 * @param fields - The name and decoder of each field.
 * @returns A `FixedSizeDecoder` or `VariableSizeDecoder` for decoding custom objects.
 *
 * @example
 * Decoding a custom struct.
 * ```ts
 * const decoder = getStructDecoder([
 *   ['name', fixCodecSize(getUtf8Decoder(), 5)],
 *   ['age', getU8Decoder()]
 * ]);
 *
 * const struct = decoder.decode(new Uint8Array([
 *   0x41,0x6c,0x69,0x63,0x65,0x2a
 * ]));
 * // { name: 'Alice', age: 42 }
 * ```
 *
 * @see {@link getStructCodec}
 */
export function getStructDecoder<const TFields extends Fields<FixedSizeDecoder<any>>>(
    fields: TFields,
): FixedSizeDecoder<GetDecoderTypeFromFields<TFields>>;
export function getStructDecoder<const TFields extends Fields<Decoder<any>>>(
    fields: TFields,
): VariableSizeDecoder<GetDecoderTypeFromFields<TFields>>;
export function getStructDecoder<const TFields extends Fields<Decoder<any>>>(
    fields: TFields,
): Decoder<GetDecoderTypeFromFields<TFields>> {
    type TTo = GetDecoderTypeFromFields<TFields>;
    const fieldCodecs = fields.map(([, codec]) => codec);
    const fixedSize = sumCodecSizes(fieldCodecs.map(getFixedSize));
    const maxSize = sumCodecSizes(fieldCodecs.map(getMaxSize)) ?? undefined;

    return createDecoder({
        ...(fixedSize === null ? { maxSize } : { fixedSize }),
        read: (bytes: ReadonlyUint8Array | Uint8Array, offset) => {
            const struct = {} as TTo;
            fields.forEach(([key, codec]) => {
                const [value, newOffset] = codec.read(bytes, offset);
                offset = newOffset;
                struct[key as keyof TTo] = value;
            });
            return [struct, offset];
        },
    });
}

/**
 * Returns a codec for encoding and decoding custom objects.
 *
 * This codec serializes objects by encoding and decoding each field sequentially.
 *
 * @typeParam TFields - The fields of the struct, each paired with a codec.
 *
 * @param fields - The name and codec of each field.
 * @returns A `FixedSizeCodec` or `VariableSizeCodec` for encoding and decoding custom objects.
 *
 * @example
 * Encoding and decoding a custom struct.
 * ```ts
 * const codec = getStructCodec([
 *   ['name', fixCodecSize(getUtf8Codec(), 5)],
 *   ['age', getU8Codec()]
 * ]);
 *
 * const bytes = codec.encode({ name: 'Alice', age: 42 });
 * // 0x416c6963652a
 * //   |         └── Age (42)
 * //   └── Name ("Alice")
 *
 * const struct = codec.decode(bytes);
 * // { name: 'Alice', age: 42 }
 * ```
 *
 * @remarks
 * Separate {@link getStructEncoder} and {@link getStructDecoder} functions are available.
 *
 * ```ts
 * const bytes = getStructEncoder([
 *   ['name', fixCodecSize(getUtf8Encoder(), 5)],
 *   ['age', getU8Encoder()]
 * ]).encode({ name: 'Alice', age: 42 });
 *
 * const struct = getStructDecoder([
 *   ['name', fixCodecSize(getUtf8Decoder(), 5)],
 *   ['age', getU8Decoder()]
 * ]).decode(bytes);
 * ```
 *
 * @see {@link getStructEncoder}
 * @see {@link getStructDecoder}
 */
export function getStructCodec<const TFields extends Fields<FixedSizeCodec<any>>>(
    fields: TFields,
): FixedSizeCodec<
    GetEncoderTypeFromFields<TFields>,
    GetDecoderTypeFromFields<TFields> & GetEncoderTypeFromFields<TFields>
>;
export function getStructCodec<const TFields extends Fields<Codec<any>>>(
    fields: TFields,
): VariableSizeCodec<
    GetEncoderTypeFromFields<TFields>,
    GetDecoderTypeFromFields<TFields> & GetEncoderTypeFromFields<TFields>
>;
export function getStructCodec<const TFields extends Fields<Codec<any>>>(
    fields: TFields,
): Codec<GetEncoderTypeFromFields<TFields>, GetDecoderTypeFromFields<TFields> & GetEncoderTypeFromFields<TFields>> {
    return combineCodec(
        getStructEncoder(fields),
        getStructDecoder(fields) as Decoder<GetDecoderTypeFromFields<TFields> & GetEncoderTypeFromFields<TFields>>,
    );
}

/**
 * Represents a single field definition in the struct builder.
 * Can be either a static decoder or a function that receives the partially decoded struct.
 */
type FieldDefinition = {
    codec: Decoder<any> | ((partial: any) => Decoder<any>);
    key: string;
};

/**
 * A builder for creating struct decoders with dependent fields.
 *
 * This builder allows later fields to access previously decoded values, enabling
 * use cases like variable-length arrays where the length is stored in an earlier field.
 *
 * @typeParam TPartial - The accumulated type of all fields defined so far.
 */
export interface StructDecoderBuilder<TPartial> {
    /**
     * Builds the final decoder from the accumulated field definitions.
     *
     * @returns A decoder that decodes all defined fields in sequence.
     *          If any field is dynamic (depends on previous fields), the resulting decoder
     *          will be a `VariableSizeDecoder`. Otherwise, size is determined by the static fields.
     *
     * @example
     * Building and using a struct decoder.
     * ```ts
     * const decoder = structDecoderBuilder()
     *   .field('x', getU32Decoder())
     *   .field('y', getU32Decoder())
     *   .build();
     *
     * const point = decoder.decode(bytes);
     * // point: { x: number, y: number }
     * ```
     */
    build(): Decoder<TPartial>;

    /**
     * Adds a field to the struct decoder.
     *
     * @typeParam K - The field name (string literal).
     * @typeParam V - The type of the decoded value.
     *
     * @param key - The name of the field.
     * @param codec - Either a `Decoder<V>` or a function that receives the partially decoded struct
     *                and returns a `Decoder<V>`. This allows the decoder to depend on previously decoded fields.
     * @returns A new builder with the field added to the accumulated type.
     *
     * @example
     * Creating a struct where the array length depends on a previous field.
     * ```ts
     * const decoder = structDecoderBuilder()
     *   .field('version', getU8Decoder())
     *   .field('length', getU32Decoder())
     *   .field('data', (fields) => getArrayDecoder(getU8Decoder(), { size: fields.length }))
     *   .build();
     *
     * const result = decoder.decode(bytes);
     * // result: { version: number, length: number, data: number[] }
     * ```
     */
    field<K extends string, V>(
        key: K,
        codec: Decoder<V> | ((partial: TPartial) => Decoder<V>),
    ): StructDecoderBuilder<Record<K, V> & TPartial>;
}

/**
 * Internal implementation of the struct decoder builder.
 */
class StructDecoderBuilderImpl<TPartial> implements StructDecoderBuilder<TPartial> {
    constructor(private readonly fields: readonly FieldDefinition[] = []) {}

    field<K extends string, V>(
        key: K,
        codec: Decoder<V> | ((partial: TPartial) => Decoder<V>),
    ): StructDecoderBuilder<Record<K, V> & TPartial> {
        return new StructDecoderBuilderImpl<Record<K, V> & TPartial>([...this.fields, { codec, key }]);
    }

    build(): Decoder<TPartial> {
        const fields = this.fields;

        // Check if all fields are static decoders (not functions)
        const hasDynamicFields = fields.some(f => typeof f.codec === 'function');

        if (!hasDynamicFields) {
            // All fields are static - we can compute fixed/variable size
            const staticCodecs = fields.map(f => f.codec as Decoder<any>);
            const fixedSize = sumCodecSizes(staticCodecs.map(getFixedSize));
            const maxSize = sumCodecSizes(staticCodecs.map(getMaxSize)) ?? undefined;

            return createDecoder({
                ...(fixedSize === null ? { maxSize } : { fixedSize }),
                read: (bytes: ReadonlyUint8Array | Uint8Array, offset) => {
                    const struct = {} as TPartial;
                    for (const { key, codec } of fields) {
                        const [value, newOffset] = (codec as Decoder<any>).read(bytes, offset);
                        offset = newOffset;
                        (struct as any)[key] = value;
                    }
                    return [struct, offset];
                },
            });
        } else {
            // Has dynamic fields - treat as variable size
            // We could be smarter about maxSize here, but it's complex
            return createDecoder({
                read: (bytes: ReadonlyUint8Array | Uint8Array, offset) => {
                    const struct = {} as TPartial;
                    for (const { key, codec } of fields) {
                        const actualCodec = typeof codec === 'function' ? codec(struct) : codec;
                        const [value, newOffset] = actualCodec.read(bytes, offset);
                        offset = newOffset;
                        (struct as any)[key] = value;
                    }
                    return [struct, offset];
                },
            });
        }
    }
}

/**
 * Creates a new struct decoder builder.
 *
 * This builder enables creating struct decoders where later fields can depend on
 * values decoded from earlier fields. This is particularly useful for variable-length
 * structures where the length is stored as a prefix.
 *
 * @returns An empty builder ready to have fields added via `.field()`.
 *
 * @example
 * Building a decoder for a length-prefixed array.
 * ```ts
 * const decoder = structDecoderBuilder()
 *   .field('length', getU32Decoder())
 *   .field('items', (fields) => getArrayDecoder(getU8Decoder(), { size: fields.length }))
 *   .build();
 *
 * const bytes = new Uint8Array([
 *   0x03, 0x00, 0x00, 0x00,  // length = 3
 *   0x0a, 0x0b, 0x0c          // items = [10, 11, 12]
 * ]);
 *
 * const result = decoder.decode(bytes);
 * // { length: 3, items: [10, 11, 12] }
 * ```
 *
 * @example
 * Building a decoder with conditional structure based on a version field.
 * ```ts
 * const decoder = structDecoderBuilder()
 *   .field('version', getU8Decoder())
 *   .field('data', (fields) =>
 *     fields.version === 1
 *       ? getU32Decoder()  // v1: 32-bit data
 *       : getU64Decoder()  // v2: 64-bit data
 *   )
 *   .build();
 * ```
 *
 * @see {@link StructDecoderBuilder}
 * @see {@link getStructDecoder}
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function structDecoderBuilder(): StructDecoderBuilder<{}> {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    return new StructDecoderBuilderImpl<{}>([]);
}
