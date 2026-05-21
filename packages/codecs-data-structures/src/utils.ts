/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Codec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    isFixedSize,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

/**
 * Functionally, this type helper is equivalent to the identity type — i.e. `type Identity<T> = T`.
 * However, wrapping generic object mappings in this type significantly reduces the number
 * of instantiation expressions processed, which increases TypeScript performance and
 * prevents "Type instantiation is excessively deep and possibly infinite" errors.
 *
 * This works because TypeScript doesn't create a new level of nesting when encountering conditional generic types.
 * @see https://github.com/microsoft/TypeScript/issues/34933
 * @see https://github.com/kysely-org/kysely/pull/483
 */
export type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never;

type IsUnion<T, U = T> = [T] extends [never] ? false : T extends unknown ? ([U] extends [T] ? false : true) : false;

type IsPreciseNumberLiteral<TSize extends number> = number extends TSize
    ? false
    : IsUnion<TSize> extends true
      ? false
      : true;

type ContainsVariableSizeCodec<TItems extends readonly unknown[], TVariableSizeCodec> = number extends TItems['length']
    ? [TItems[number]] extends [TVariableSizeCodec]
        ? true
        : false
    : TItems extends readonly [infer THead, ...infer TTail]
      ? [THead] extends [TVariableSizeCodec]
          ? true
          : ContainsVariableSizeCodec<TTail, TVariableSizeCodec>
      : false;

type GetFixedCodecSize<TItem> = TItem extends { readonly fixedSize: infer TSize }
    ? TSize extends number
        ? TSize
        : never
    : never;

type GetFixedCodecSizeState<TItems extends readonly unknown[]> = TItems extends readonly []
    ? readonly ['fixed', 0]
    : TItems extends readonly [infer TOnly]
      ? readonly ['fixed', GetFixedCodecSize<TOnly>]
      : number extends TItems['length']
        ? IsPreciseNumberLiteral<GetFixedCodecSize<TItems[number]>> extends true
            ? readonly ['fixed', number]
            : readonly ['unknown']
        : GetFixedCodecSizeTupleState<TItems>;

type GetFixedCodecSizeTupleState<
    TItems extends readonly unknown[],
    TExpectedSize extends number | undefined = undefined,
> = TItems extends readonly [infer THead, ...infer TTail]
    ? GetFixedCodecSize<THead> extends infer THeadSize extends number
        ? IsPreciseNumberLiteral<THeadSize> extends true
            ? TExpectedSize extends number
                ? THeadSize extends TExpectedSize
                    ? GetFixedCodecSizeTupleState<TTail, TExpectedSize>
                    : readonly ['variable']
                : GetFixedCodecSizeTupleState<TTail, THeadSize>
            : readonly ['unknown']
        : never
    : TExpectedSize extends number
      ? readonly ['fixed', TExpectedSize]
      : readonly ['fixed', 0];

/** Infers the TypeScript type for values that can be encoded using a list of variant encoders. */
export type GetEncoderTypeFromVariants<TVariants extends readonly Encoder<any>[]> = DrainOuterGeneric<{
    [I in keyof TVariants]: TVariants[I] extends Encoder<infer TFrom> ? TFrom : never;
}>[number];

/** Infers the TypeScript type for values that can be decoded using a list of variant decoders. */
export type GetDecoderTypeFromVariants<TVariants extends readonly Decoder<any>[]> = DrainOuterGeneric<{
    [I in keyof TVariants]: TVariants[I] extends Decoder<infer TFrom> ? TFrom : never;
}>[number];

type GetFixedSizeEncoderFromVariants<TVariants extends readonly FixedSizeEncoder<any, any>[]> =
    GetFixedCodecSizeState<TVariants> extends readonly ['fixed', infer TSize extends number]
        ? FixedSizeEncoder<GetEncoderTypeFromVariants<TVariants>, TSize>
        : GetFixedCodecSizeState<TVariants> extends readonly ['variable']
          ? VariableSizeEncoder<GetEncoderTypeFromVariants<TVariants>>
          : Encoder<GetEncoderTypeFromVariants<TVariants>>;

type GetFixedSizeDecoderFromVariants<TVariants extends readonly FixedSizeDecoder<any, any>[]> =
    GetFixedCodecSizeState<TVariants> extends readonly ['fixed', infer TSize extends number]
        ? FixedSizeDecoder<GetDecoderTypeFromVariants<TVariants>, TSize>
        : GetFixedCodecSizeState<TVariants> extends readonly ['variable']
          ? VariableSizeDecoder<GetDecoderTypeFromVariants<TVariants>>
          : Decoder<GetDecoderTypeFromVariants<TVariants>>;

type GetFixedSizeCodecFromVariants<TVariants extends readonly FixedSizeCodec<any, any, any>[]> =
    GetFixedCodecSizeState<TVariants> extends readonly ['fixed', infer TSize extends number]
        ? FixedSizeCodec<
              GetEncoderTypeFromVariants<TVariants>,
              GetDecoderTypeFromVariants<TVariants> & GetEncoderTypeFromVariants<TVariants>,
              TSize
          >
        : GetFixedCodecSizeState<TVariants> extends readonly ['variable']
          ? VariableSizeCodec<
                GetEncoderTypeFromVariants<TVariants>,
                GetDecoderTypeFromVariants<TVariants> & GetEncoderTypeFromVariants<TVariants>
            >
          : Codec<
                GetEncoderTypeFromVariants<TVariants>,
                GetDecoderTypeFromVariants<TVariants> & GetEncoderTypeFromVariants<TVariants>
            >;

/** Infers whether a union encoder is fixed-size, variable-size, or unknown from its variant encoders. */
export type GetUnionEncoderType<TVariants extends readonly Encoder<any>[]> =
    TVariants extends readonly FixedSizeEncoder<any, any>[]
        ? GetFixedSizeEncoderFromVariants<TVariants>
        : ContainsVariableSizeCodec<TVariants, VariableSizeEncoder<any>> extends true
          ? VariableSizeEncoder<GetEncoderTypeFromVariants<TVariants>>
          : Encoder<GetEncoderTypeFromVariants<TVariants>>;

/** Infers whether a union decoder is fixed-size, variable-size, or unknown from its variant decoders. */
export type GetUnionDecoderType<TVariants extends readonly Decoder<any>[]> =
    TVariants extends readonly FixedSizeDecoder<any, any>[]
        ? GetFixedSizeDecoderFromVariants<TVariants>
        : ContainsVariableSizeCodec<TVariants, VariableSizeDecoder<any>> extends true
          ? VariableSizeDecoder<GetDecoderTypeFromVariants<TVariants>>
          : Decoder<GetDecoderTypeFromVariants<TVariants>>;

/** Infers whether a union codec is fixed-size, variable-size, or unknown from its variant codecs. */
export type GetUnionCodecType<TVariants extends readonly Codec<any>[]> = TVariants extends readonly FixedSizeCodec<
    any,
    any,
    any
>[]
    ? GetFixedSizeCodecFromVariants<TVariants>
    : ContainsVariableSizeCodec<TVariants, VariableSizeCodec<any>> extends true
      ? VariableSizeCodec<
            GetEncoderTypeFromVariants<TVariants>,
            GetDecoderTypeFromVariants<TVariants> & GetEncoderTypeFromVariants<TVariants>
        >
      : Codec<
            GetEncoderTypeFromVariants<TVariants>,
            GetDecoderTypeFromVariants<TVariants> & GetEncoderTypeFromVariants<TVariants>
        >;

export function maxCodecSizes(sizes: (number | null)[]): number | null {
    return sizes.reduce(
        (all, size) => (all === null || size === null ? null : Math.max(all, size)),
        0 as number | null,
    );
}

export function sumCodecSizes(sizes: (number | null)[]): number | null {
    return sizes.reduce((all, size) => (all === null || size === null ? null : all + size), 0 as number | null);
}

export function getFixedSize(codec: { fixedSize: number } | { maxSize?: number }): number | null {
    return isFixedSize(codec) ? codec.fixedSize : null;
}

export function getMaxSize(codec: { fixedSize: number } | { maxSize?: number }): number | null {
    return isFixedSize(codec) ? codec.fixedSize : (codec.maxSize ?? null);
}
