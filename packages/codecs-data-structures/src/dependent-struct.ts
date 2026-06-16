import { createDecoder, Decoder, FixedSizeDecoder, ReadonlyUint8Array, VariableSizeDecoder } from '@solana/codecs-core';

import { DrainOuterGeneric, getFixedSize, sumCodecSizes } from './utils';

/**
 * A function that builds a {@link Decoder} for a struct field whose shape
 * depends on the values of previously decoded fields in the same struct.
 *
 * The function receives a frozen snapshot of all fields that have been decoded
 * so far, in declaration order, and must return the {@link Decoder} that should
 * be used to read the current field from the byte stream.
 *
 * @typeParam TPriorFields - The shape of the fields that have already been
 *     decoded by the time this factory is invoked.
 * @typeParam TValue - The type of the value produced by the returned decoder.
 *
 * @see {@link createDependentStructDecoder}
 */
export type DependentStructDecoderFieldFactory<TPriorFields extends Record<string, unknown>, TValue> = (
    fields: Readonly<TPriorFields>,
) => Decoder<TValue>;

/**
 * A fluent builder that accumulates field decoders for a struct whose later
 * fields may depend on the values of earlier ones.
 *
 * Each call to {@link DependentStructDecoderBuilder.field | `field`} returns a
 * new builder whose accumulated field type is widened by the newly added field.
 * Call {@link DependentStructDecoderBuilder.build | `build`} to obtain the
 * final {@link Decoder} once every field has been declared.
 *
 * The builder tracks at the type level whether the struct decoded so far has a
 * fixed size. Adding a {@link FixedSizeDecoder} preserves that property, while
 * adding a {@link VariableSizeDecoder} or a {@link DependentStructDecoderFieldFactory | field factory}
 * drops the builder to variable size and it stays variable thereafter.
 *
 * Instances of this type are immutable. Calling `field` does not mutate the
 * receiver; it returns a new builder.
 *
 * @typeParam TFields - The shape of the struct that has been accumulated so far.
 * @typeParam TIsFixedSize - `true` while every field added so far is a
 *     {@link FixedSizeDecoder}, `false` once any variable size decoder or
 *     factory has been added.
 *
 * @see {@link createDependentStructDecoder}
 */
export type DependentStructDecoderBuilder<TFields extends Record<string, unknown>, TIsFixedSize extends boolean> = {
    /**
     * Finalizes the builder and returns a {@link Decoder} that decodes each
     * declared field in turn, in the order they were added.
     *
     * Returns a {@link FixedSizeDecoder} when every field has been added with a
     * fixed size decoder, and a {@link VariableSizeDecoder} otherwise.
     */
    build(): TIsFixedSize extends true
        ? FixedSizeDecoder<DrainOuterGeneric<TFields>>
        : VariableSizeDecoder<DrainOuterGeneric<TFields>>;

    /**
     * Adds a field decoded by a {@link VariableSizeDecoder}. Drops the builder
     * to variable size; subsequent {@link field} calls cannot raise it back to
     * fixed size.
     *
     * Adding a field that has already been declared on this builder is a
     * compile time error.
     */
    field<TName extends string, TValue>(
        name: TName extends keyof TFields ? never : TName,
        decoder: VariableSizeDecoder<TValue>,
    ): DependentStructDecoderBuilder<DrainOuterGeneric<TFields & { [K in TName]: TValue }>, false>;

    /**
     * Adds a field whose decoder is built from a frozen snapshot of the fields
     * that precede it. Drops the builder to variable size since the byte
     * length of the produced decoder cannot be known at type time.
     *
     * Adding a field that has already been declared on this builder is a
     * compile time error.
     */
    field<TName extends string, TValue>(
        name: TName extends keyof TFields ? never : TName,
        factory: DependentStructDecoderFieldFactory<TFields, TValue>,
    ): DependentStructDecoderBuilder<DrainOuterGeneric<TFields & { [K in TName]: TValue }>, false>;

    /**
     * Adds a field decoded by a {@link FixedSizeDecoder}. Preserves the fixed
     * size property of the builder.
     *
     * Adding a field that has already been declared on this builder is a
     * compile time error.
     */
    field<TName extends string, TValue>(
        name: TName extends keyof TFields ? never : TName,
        decoder: FixedSizeDecoder<TValue>,
    ): DependentStructDecoderBuilder<DrainOuterGeneric<TFields & { [K in TName]: TValue }>, TIsFixedSize>;
};

/**
 * Creates a fluent builder for a struct decoder whose later fields may depend
 * on the decoded values of earlier ones.
 *
 * Unlike {@link getStructDecoder}, which accepts a fixed array of named
 * decoders, this builder lets each field provide a factory that receives the
 * values that have already been decoded. This is useful for binary formats
 * where a count, version, or discriminator decoded near the start of the
 * struct controls how a later field must be parsed.
 *
 * The builder mirrors the fixed vs variable size behaviour of
 * {@link getStructDecoder}. The empty builder finishes to a
 * {@link FixedSizeDecoder} of size zero. Adding a {@link FixedSizeDecoder}
 * preserves the fixed size property and the sizes accumulate. Adding a
 * {@link VariableSizeDecoder} or a {@link DependentStructDecoderFieldFactory | field factory}
 * drops the builder to variable size, which is then preserved by every
 * subsequent {@link DependentStructDecoderBuilder.field | `field`} call.
 *
 * The returned builder is immutable; each {@link DependentStructDecoderBuilder.field | `field`}
 * call returns a new builder whose accumulated field type is widened by the
 * newly added field. Call {@link DependentStructDecoderBuilder.build | `build`}
 * to produce the final decoder.
 *
 * @remarks
 * Prefer {@link getStructDecoder} when every field's decoder is independent of
 * the values that precede it. Reach for this builder only when at least one
 * field needs to be parameterised by another.
 *
 * The encoder direction does not need a dependent variant. An encoder already
 * has access to the entire value when serialising, so the existing
 * {@link getStructEncoder} can be paired with the decoder returned by this
 * builder and combined with `combineCodec` to obtain a full codec.
 *
 * @example
 * Decoding a struct whose array length is read from an earlier field.
 * ```ts
 * import { getArrayDecoder } from '@solana/codecs-data-structures';
 * import { getU8Decoder, getU32Decoder } from '@solana/codecs-numbers';
 *
 * const decoder = createDependentStructDecoder()
 *     .field('count', getU8Decoder())
 *     .field('values', fields => getArrayDecoder(getU32Decoder(), { size: fields.count }))
 *     .build();
 *
 * decoder.decode(new Uint8Array([0x02, 0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00]));
 * // { count: 2, values: [1, 2] }
 * ```
 *
 * @example
 * Mixing static and dependent fields, with a discriminator selecting the payload decoder.
 * ```ts
 * const decoder = createDependentStructDecoder()
 *     .field('version', getU8Decoder())
 *     .field('header', fields => fields.version === 0 ? getU16Decoder() : getU32Decoder())
 *     .build();
 * ```
 *
 * @example
 * Combining the dependent decoder with a static encoder to obtain a full codec.
 * ```ts
 * import { combineCodec } from '@solana/codecs-core';
 *
 * const encoder = getStructEncoder([
 *     ['count', getU8Encoder()],
 *     ['values', getArrayEncoder(getU32Encoder())],
 * ]);
 * const decoder = createDependentStructDecoder()
 *     .field('count', getU8Decoder())
 *     .field('values', fields => getArrayDecoder(getU32Decoder(), { size: fields.count }))
 *     .build();
 * const codec = combineCodec(encoder, decoder);
 * ```
 *
 * @see {@link getStructDecoder}
 * @see {@link getStructEncoder}
 */
export function createDependentStructDecoder(): DependentStructDecoderBuilder<Record<never, never>, true> {
    return buildFromEntries([]);
}

type InternalEntry = Readonly<{
    name: string;
    resolveDecoder: (fields: Record<string, unknown>) => Decoder<unknown>;
    /**
     * The static decoder for this entry, if the entry was added with one
     * directly. Absent when the entry was added with a factory, in which case
     * the entry is treated as variable size for the purposes of computing the
     * struct's total fixed size.
     */
    staticDecoder: Decoder<unknown> | undefined;
}>;

function buildFromEntries<TFields extends Record<string, unknown>, TIsFixedSize extends boolean>(
    entries: readonly InternalEntry[],
): DependentStructDecoderBuilder<TFields, TIsFixedSize> {
    return {
        build() {
            const staticDecoders = entries.map(e => e.staticDecoder);
            const everyStatic = staticDecoders.every((d): d is Decoder<unknown> => d !== undefined);
            const fixedSize = everyStatic ? sumCodecSizes(staticDecoders.map(getFixedSize)) : null;
            const read = (
                bytes: ReadonlyUint8Array | Uint8Array,
                offset: number,
            ): [DrainOuterGeneric<TFields>, number] => {
                const decoded: Record<string, unknown> = {};
                for (const { name, resolveDecoder } of entries) {
                    const decoder = resolveDecoder(decoded);
                    const [value, newOffset] = decoder.read(bytes, offset);
                    decoded[name] = value;
                    offset = newOffset;
                }
                return [decoded as DrainOuterGeneric<TFields>, offset];
            };
            const decoder = fixedSize === null ? createDecoder({ read }) : createDecoder({ fixedSize, read });
            return decoder as never;
        },
        field<TName extends string, TValue>(
            name: TName,
            decoderOrFactory: Decoder<TValue> | DependentStructDecoderFieldFactory<TFields, TValue>,
        ): DependentStructDecoderBuilder<Record<string, unknown>, boolean> {
            const isFactory = typeof decoderOrFactory === 'function';
            const resolveDecoder = isFactory
                ? (fields: Record<string, unknown>) =>
                      decoderOrFactory(Object.freeze({ ...fields }) as Readonly<TFields>)
                : () => decoderOrFactory;
            const nextEntry: InternalEntry = {
                name,
                resolveDecoder,
                staticDecoder: isFactory ? undefined : decoderOrFactory,
            };
            return buildFromEntries([...entries, nextEntry]);
        },
    } as DependentStructDecoderBuilder<TFields, TIsFixedSize>;
}
