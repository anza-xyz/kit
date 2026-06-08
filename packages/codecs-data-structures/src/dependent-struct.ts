import { createDecoder, Decoder, ReadonlyUint8Array, VariableSizeDecoder } from '@solana/codecs-core';

import { DrainOuterGeneric } from './utils';

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
 * Call {@link DependentStructDecoderBuilder.finish | `finish`} to obtain the
 * final {@link Decoder} once every field has been declared.
 *
 * Instances of this type are immutable. Calling `field` does not mutate the
 * receiver; it returns a new builder.
 *
 * @typeParam TFields - The shape of the struct that has been accumulated so far.
 *
 * @see {@link createDependentStructDecoder}
 */
export type DependentStructDecoderBuilder<TFields extends Record<string, unknown>> = {
    /**
     * Adds a field to the struct whose decoder is either static, or built from
     * the values of previously declared fields.
     *
     * Adding a field that has already been declared on this builder is a
     * compile time error.
     *
     * @typeParam TName - The name of the field being added. Must not collide
     *     with the name of a field already declared on this builder.
     * @typeParam TValue - The type of the value produced by the field's decoder.
     *
     * @param name - The unique name of the field within the struct.
     * @param decoderOrFactory - Either a {@link Decoder} for the field, or a
     *     {@link DependentStructDecoderFieldFactory} that produces one from
     *     the previously decoded fields.
     *
     * @returns A new builder whose accumulated field type includes the newly
     *     added field.
     */
    field<TName extends string, TValue>(
        name: TName extends keyof TFields ? never : TName,
        decoderOrFactory: Decoder<TValue> | DependentStructDecoderFieldFactory<TFields, TValue>,
    ): DependentStructDecoderBuilder<DrainOuterGeneric<TFields & { [K in TName]: TValue }>>;

    /**
     * Finalizes the builder and returns a {@link VariableSizeDecoder} that
     * decodes each declared field in turn, in the order they were added.
     *
     * The resulting decoder is always variable size because the size of any
     * field declared with a factory cannot be determined ahead of time.
     */
    finish(): VariableSizeDecoder<DrainOuterGeneric<TFields>>;
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
 * The returned builder is immutable; each {@link DependentStructDecoderBuilder.field | `field`}
 * call returns a new builder whose accumulated field type is widened by the
 * newly added field. Call {@link DependentStructDecoderBuilder.finish | `finish`}
 * to produce the final decoder.
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
 *     .finish();
 *
 * decoder.decode(new Uint8Array([0x02, 0x01, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00]));
 * // { count: 2, values: [1, 2] }
 * ```
 *
 * @example
 * Mixing static and dependent fields.
 * ```ts
 * const decoder = createDependentStructDecoder()
 *     .field('version', getU8Decoder())
 *     .field('header', fields => fields.version === 0 ? getU16Decoder() : getU32Decoder())
 *     .finish();
 * ```
 *
 * @see {@link getStructDecoder}
 */
export function createDependentStructDecoder(): DependentStructDecoderBuilder<Record<never, never>> {
    return buildFromEntries([]);
}

type ResolvedDecoder = (fields: Record<string, unknown>) => Decoder<unknown>;
type InternalEntry = Readonly<{ name: string; resolveDecoder: ResolvedDecoder }>;

function buildFromEntries<TFields extends Record<string, unknown>>(
    entries: readonly InternalEntry[],
): DependentStructDecoderBuilder<TFields> {
    return {
        field<TName extends string, TValue>(
            name: TName extends keyof TFields ? never : TName,
            decoderOrFactory: Decoder<TValue> | DependentStructDecoderFieldFactory<TFields, TValue>,
        ): DependentStructDecoderBuilder<DrainOuterGeneric<TFields & { [K in TName]: TValue }>> {
            const resolveDecoder: ResolvedDecoder =
                typeof decoderOrFactory === 'function'
                    ? fields => decoderOrFactory(fields as TFields)
                    : () => decoderOrFactory;
            const nextEntry: InternalEntry = { name: name as string, resolveDecoder };
            return buildFromEntries<DrainOuterGeneric<TFields & { [K in TName]: TValue }>>([...entries, nextEntry]);
        },
        finish(): VariableSizeDecoder<DrainOuterGeneric<TFields>> {
            return createDecoder({
                read(bytes: ReadonlyUint8Array | Uint8Array, offset: number): [DrainOuterGeneric<TFields>, number] {
                    const decoded: Record<string, unknown> = {};
                    for (const { name, resolveDecoder } of entries) {
                        const decoder = resolveDecoder(decoded);
                        const [value, newOffset] = decoder.read(bytes, offset);
                        decoded[name] = value;
                        offset = newOffset;
                    }
                    return [decoded as DrainOuterGeneric<TFields>, offset];
                },
            });
        },
    };
}
