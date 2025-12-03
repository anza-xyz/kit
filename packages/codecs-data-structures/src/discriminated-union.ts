/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Codec,
    combineCodec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    transformDecoder,
    transformEncoder,
} from '@solana/codecs-core';
import { getU8Decoder, getU8Encoder, NumberCodec, NumberDecoder, NumberEncoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__CODECS__INVALID_DISCRIMINATED_UNION_VARIANT, SolanaError } from '@solana/errors';

import { getTupleDecoder, getTupleEncoder } from './tuple';
import { getUnionDecoder, getUnionEncoder } from './union';
import { DrainOuterGeneric } from './utils';

/**
 * Represents a discriminated union using a specific discriminator property.
 *
 * A discriminated union is a TypeScript-friendly way to represent Rust-like enums.
 * Each variant in the union is distinguished by a shared discriminator property.
 *
 * @typeParam TDiscriminatorProperty - The name of the discriminator property.
 * @typeParam TDiscriminatorValue - The type of the discriminator value.
 *
 * @example
 * ```ts
 * type Message =
 *   | { __kind: 'Quit' } // Empty variant
 *   | { __kind: 'Write'; fields: [string] } // Tuple variant
 *   | { __kind: 'Move'; x: number; y: number }; // Struct variant
 * ```
 */
export type DiscriminatedUnion<
    TDiscriminatorProperty extends string = '__kind',
    TDiscriminatorValue extends string = string,
> = {
    [P in TDiscriminatorProperty]: TDiscriminatorValue;
};

/**
 * Extracts a variant from a discriminated union based on its discriminator value.
 *
 * @typeParam TUnion - The discriminated union type.
 * @typeParam TDiscriminatorProperty - The property used as the discriminator.
 * @typeParam TDiscriminatorValue - The specific variant to extract.
 *
 * @example
 * ```ts
 * type Message =
 *   | { __kind: 'Quit' }
 *   | { __kind: 'Write'; fields: [string] }
 *   | { __kind: 'Move'; x: number; y: number };
 *
 * type ClickEvent = GetDiscriminatedUnionVariant<Message, '__kind', 'Move'>;
 * // -> { __kind: 'Move'; x: number; y: number }
 * ```
 */
export type GetDiscriminatedUnionVariant<
    TUnion extends DiscriminatedUnion<TDiscriminatorProperty>,
    TDiscriminatorProperty extends string,
    TDiscriminatorValue extends TUnion[TDiscriminatorProperty],
> = Extract<TUnion, DiscriminatedUnion<TDiscriminatorProperty, TDiscriminatorValue>>;

/**
 * Extracts a variant from a discriminated union without its discriminator property.
 *
 * @typeParam TUnion - The discriminated union type.
 * @typeParam TDiscriminatorProperty - The property used as the discriminator.
 * @typeParam TDiscriminatorValue - The specific variant to extract.
 *
 * @example
 * ```ts
 * type Message =
 *   | { __kind: 'Quit' }
 *   | { __kind: 'Write'; fields: [string] }
 *   | { __kind: 'Move'; x: number; y: number };
 *
 * type MoveContent = GetDiscriminatedUnionVariantContent<Message, '__kind', 'Move'>;
 * // -> { x: number; y: number }
 * ```
 */
export type GetDiscriminatedUnionVariantContent<
    TUnion extends DiscriminatedUnion<TDiscriminatorProperty>,
    TDiscriminatorProperty extends string,
    TDiscriminatorValue extends TUnion[TDiscriminatorProperty],
> = Omit<GetDiscriminatedUnionVariant<TUnion, TDiscriminatorProperty, TDiscriminatorValue>, TDiscriminatorProperty>;

/**
 * Defines the configuration for discriminated union codecs.
 *
 * This configuration controls how the discriminator is stored and named.
 *
 * @typeParam TDiscriminatorProperty - The property name of the discriminator.
 * @typeParam TDiscriminatorSize - The codec used for the discriminator prefix.
 */
export type DiscriminatedUnionCodecConfig<
    TDiscriminatorProperty extends string = '__kind',
    TDiscriminatorSize = NumberCodec | NumberDecoder | NumberEncoder,
> = {
    /**
     * The property name of the discriminator.
     * @defaultValue `__kind`
     */
    discriminator?: TDiscriminatorProperty;
    /**
     * The codec used to encode/decode the discriminator prefix.
     * @defaultValue `u8` prefix
     */
    size?: TDiscriminatorSize;
};

type DiscriminatorValue = bigint | boolean | number | string | null | undefined;
type Variants<T> = readonly (readonly [DiscriminatorValue, T])[];
type ArrayIndices<T extends readonly unknown[]> = Exclude<Partial<T>['length'], T['length']> & number;

type GetEncoderTypeFromVariants<
    TVariants extends Variants<Encoder<any>>,
    TDiscriminatorProperty extends string,
> = DrainOuterGeneric<{
    [I in ArrayIndices<TVariants>]: (TVariants[I][1] extends Encoder<infer TFrom>
        ? TFrom extends object
            ? TFrom
            : object
        : never) & { [P in TDiscriminatorProperty]: TVariants[I][0] };
}>[ArrayIndices<TVariants>];

type GetDecoderTypeFromVariants<
    TVariants extends Variants<Decoder<any>>,
    TDiscriminatorProperty extends string,
> = DrainOuterGeneric<{
    [I in ArrayIndices<TVariants>]: (TVariants[I][1] extends Decoder<infer TTo>
        ? TTo extends object
            ? TTo
            : object
        : never) & { [P in TDiscriminatorProperty]: TVariants[I][0] };
}>[ArrayIndices<TVariants>];

type UnionEncoder<TVariants extends Variants<Encoder<unknown>>, TDiscriminatorProperty extends string> =
    TVariants extends Variants<FixedSizeEncoder<any>>
        ? FixedSizeEncoder<GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>>
        : Encoder<GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>>;

type UnionDecoder<TVariants extends Variants<Decoder<unknown>>, TDiscriminatorProperty extends string> =
    TVariants extends Variants<FixedSizeDecoder<any>>
        ? FixedSizeDecoder<GetDecoderTypeFromVariants<TVariants, TDiscriminatorProperty>>
        : Decoder<GetDecoderTypeFromVariants<TVariants, TDiscriminatorProperty>>;

type UnionCodec<TVariants extends Variants<Codec<unknown, unknown>>, TDiscriminatorProperty extends string> =
    TVariants extends Variants<FixedSizeCodec<any, any>>
        ? FixedSizeCodec<
              GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>,
              GetDecoderTypeFromVariants<TVariants, TDiscriminatorProperty> &
                  GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>
          >
        : Codec<
              GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>,
              GetDecoderTypeFromVariants<TVariants, TDiscriminatorProperty> &
                  GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>
          >;

/**
 * Returns an encoder for discriminated unions.
 *
 * This encoder serializes objects that follow the discriminated union pattern
 * by prefixing them with a numerical discriminator that represents their variant.
 *
 * Unlike {@link getUnionEncoder}, this encoder automatically extracts and processes
 * the discriminator property (default: `__kind`) from each variant.
 *
 * For more details, see {@link getDiscriminatedUnionCodec}.
 *
 * @typeParam TVariants - The variants of the discriminated union.
 * @typeParam TDiscriminatorProperty - The property used as the discriminator.
 *
 * @param variants - The variant encoders as `[discriminator, encoder]` pairs.
 * @param config - Configuration options for encoding.
 * @returns An `Encoder` for encoding discriminated union objects.
 *
 * @example
 * Encoding a discriminated union.
 * ```ts
 * type Message =
 *   | { __kind: 'Quit' } // Empty variant.
 *   | { __kind: 'Write'; fields: [string] } // Tuple variant.
 *   | { __kind: 'Move'; x: number; y: number }; // Struct variant.
 *
 * const messageEncoder = getDiscriminatedUnionEncoder([
 *   ['Quit', getUnitEncoder()],
 *   ['Write', getStructEncoder([['fields', getTupleEncoder([addCodecSizePrefix(getUtf8Encoder(), getU32Encoder())])]])],
 *   ['Move', getStructEncoder([['x', getI32Encoder()], ['y', getI32Encoder()]])]
 * ]);
 *
 * messageEncoder.encode({ __kind: 'Move', x: 5, y: 6 });
 * // 0x020500000006000000
 * //   | |       └── Field y (6)
 * //   | └── Field x (5)
 * //   └── 1-byte discriminator (Index 2 — the "Move" variant)
 * ```
 *
 * @see {@link getDiscriminatedUnionCodec}
 */
export function getDiscriminatedUnionEncoder<
    const TVariants extends Variants<Encoder<any>>,
    const TDiscriminatorProperty extends string = '__kind',
>(
    variants: TVariants,
    config: DiscriminatedUnionCodecConfig<TDiscriminatorProperty, NumberEncoder> = {},
): UnionEncoder<TVariants, TDiscriminatorProperty> {
    type TFrom = GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>;
    const discriminatorProperty = (config.discriminator ?? '__kind') as TDiscriminatorProperty;
    const prefix = config.size ?? getU8Encoder();
    return getUnionEncoder(
        variants.map(([, variant], index) =>
            transformEncoder(getTupleEncoder([prefix, variant]), (value: TFrom): [number, TFrom] => [index, value]),
        ),
        value => getVariantDiscriminator(variants, value[discriminatorProperty]),
    ) as UnionEncoder<TVariants, TDiscriminatorProperty>;
}

/**
 * Returns a decoder for discriminated unions.
 *
 * This decoder deserializes objects that follow the discriminated union pattern
 * by **reading a numerical discriminator** and mapping it to the corresponding variant.
 *
 * Unlike {@link getUnionDecoder}, this decoder automatically inserts the discriminator
 * property (default: `__kind`) into the decoded object.
 *
 * For more details, see {@link getDiscriminatedUnionCodec}.
 *
 * @typeParam TVariants - The variants of the discriminated union.
 * @typeParam TDiscriminatorProperty - The property used as the discriminator.
 *
 * @param variants - The variant decoders as `[discriminator, decoder]` pairs.
 * @param config - Configuration options for decoding.
 * @returns A `Decoder` for decoding discriminated union objects.
 *
 * @example
 * Decoding a discriminated union.
 * ```ts
 * type Message =
 *   | { __kind: 'Quit' } // Empty variant.
 *   | { __kind: 'Write'; fields: [string] } // Tuple variant.
 *   | { __kind: 'Move'; x: number; y: number }; // Struct variant.
 *
 * const messageDecoder = getDiscriminatedUnionDecoder([
 *   ['Quit', getUnitDecoder()],
 *   ['Write', getStructDecoder([['fields', getTupleDecoder([addCodecSizePrefix(getUtf8Decoder(), getU32Decoder())])]])],
 *   ['Move', getStructDecoder([['x', getI32Decoder()], ['y', getI32Decoder()]])]
 * ]);
 *
 * messageDecoder.decode(new Uint8Array([0x02,0x05,0x00,0x00,0x00,0x06,0x00,0x00,0x00]));
 * // { __kind: 'Move', x: 5, y: 6 }
 * ```
 *
 * @see {@link getDiscriminatedUnionCodec}
 */
export function getDiscriminatedUnionDecoder<
    const TVariants extends Variants<Decoder<any>>,
    const TDiscriminatorProperty extends string = '__kind',
>(
    variants: TVariants,
    config: DiscriminatedUnionCodecConfig<TDiscriminatorProperty, NumberDecoder> = {},
): UnionDecoder<TVariants, TDiscriminatorProperty> {
    const discriminatorProperty = config.discriminator ?? '__kind';
    const prefix = config.size ?? getU8Decoder();
    return getUnionDecoder(
        variants.map(([discriminator, variant]) =>
            transformDecoder(getTupleDecoder([prefix, variant]), ([, value]) => ({
                [discriminatorProperty]: discriminator,
                ...value,
            })),
        ),
        (bytes, offset) => Number(prefix.read(bytes, offset)[0]),
    ) as UnionDecoder<TVariants, TDiscriminatorProperty>;
}

/**
 * Returns a codec for encoding and decoding {@link DiscriminatedUnion}.
 *
 * A {@link DiscriminatedUnion} is a TypeScript representation of Rust-like enums, where
 * each variant is distinguished by a discriminator field (default: `__kind`).
 *
 * This codec inserts a numerical prefix to represent the variant index.
 *
 * @typeParam TVariants - The variants of the discriminated union.
 * @typeParam TDiscriminatorProperty - The property used as the discriminator.
 *
 * @param variants - The variant codecs as `[discriminator, codec]` pairs.
 * @param config - Configuration options for encoding/decoding.
 * @returns A `Codec` for encoding and decoding discriminated union objects.
 *
 * @example
 * Encoding and decoding a discriminated union.
 * ```ts
 * type Message =
 *   | { __kind: 'Quit' } // Empty variant.
 *   | { __kind: 'Write'; fields: [string] } // Tuple variant.
 *   | { __kind: 'Move'; x: number; y: number }; // Struct variant.
 *
 * const messageCodec = getDiscriminatedUnionCodec([
 *   ['Quit', getUnitCodec()],
 *   ['Write', getStructCodec([['fields', getTupleCodec([addCodecSizePrefix(getUtf8Codec(), getU32Codec())])]])],
 *   ['Move', getStructCodec([['x', getI32Codec()], ['y', getI32Codec()]])]
 * ]);
 *
 * messageCodec.encode({ __kind: 'Move', x: 5, y: 6 });
 * // 0x020500000006000000
 * //   | |       └── Field y (6)
 * //   | └── Field x (5)
 * //   └── 1-byte discriminator (Index 2 — the "Move" variant)
 *
 * const value = messageCodec.decode(bytes);
 * // { __kind: 'Move', x: 5, y: 6 }
 * ```
 *
 * @example
 * Using a `u32` discriminator instead of `u8`.
 * ```ts
 * const codec = getDiscriminatedUnionCodec([...], { size: getU32Codec() });
 *
 * codec.encode({ __kind: 'Quit' });
 * // 0x00000000
 * //   └------┘ 4-byte discriminator (Index 0)
 *
 * codec.decode(new Uint8Array([0x00, 0x00, 0x00, 0x00]));
 * // { __kind: 'Quit' }
 * ```
 *
 * @example
 * Customizing the discriminator property.
 * ```ts
 * const codec = getDiscriminatedUnionCodec([...], { discriminator: 'message' });
 *
 * codec.encode({ message: 'Quit' }); // 0x00
 * codec.decode(new Uint8Array([0x00])); // { message: 'Quit' }
 * ```
 *
 * @remarks
 * Separate `getDiscriminatedUnionEncoder` and `getDiscriminatedUnionDecoder` functions are available.
 *
 * ```ts
 * const bytes = getDiscriminatedUnionEncoder(variantEncoders).encode({ __kind: 'Quit' });
 * const message = getDiscriminatedUnionDecoder(variantDecoders).decode(bytes);
 * ```
 *
 * @see {@link getDiscriminatedUnionEncoder}
 * @see {@link getDiscriminatedUnionDecoder}
 */
export function getDiscriminatedUnionCodec<
    const TVariants extends Variants<Codec<any, any>>,
    const TDiscriminatorProperty extends string = '__kind',
>(
    variants: TVariants,
    config: DiscriminatedUnionCodecConfig<TDiscriminatorProperty, NumberCodec> = {},
): UnionCodec<TVariants, TDiscriminatorProperty> {
    return combineCodec(
        getDiscriminatedUnionEncoder(variants, config) as Encoder<
            GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>
        >,
        getDiscriminatedUnionDecoder(variants, config) as Decoder<
            GetDecoderTypeFromVariants<TVariants, TDiscriminatorProperty> &
                GetEncoderTypeFromVariants<TVariants, TDiscriminatorProperty>
        >,
    ) as UnionCodec<TVariants, TDiscriminatorProperty>;
}

function getVariantDiscriminator<const TVariants extends Variants<Decoder<any> | Encoder<any>>>(
    variants: TVariants,
    discriminatorValue: DiscriminatorValue,
) {
    const discriminator = variants.findIndex(([key]) => discriminatorValue === key);
    if (discriminator < 0) {
        throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_DISCRIMINATED_UNION_VARIANT, {
            value: discriminatorValue,
            variants: variants.map(([key]) => key),
        });
    }
    return discriminator;
}
