import {
    Codec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import { getUnionCodec, getUnionDecoder, getUnionEncoder } from '../union';

const getIndex = () => 0;

// [DESCRIBE] getUnionEncoder.
{
    // It constructs unions from a list of encoder variants.
    {
        getUnionEncoder(
            [
                {} as Encoder<null>,
                {} as Encoder<bigint | number>,
                {} as Encoder<{ value: string }>,
                {} as Encoder<{ x: number; y: number }>,
            ],
            getIndex,
        ) satisfies Encoder<bigint | number | { value: string } | { x: number; y: number } | null>;
    }

    // It returns a fixed size encoder if all variants are fixed size with the same size.
    {
        getUnionEncoder(
            [
                {} as FixedSizeEncoder<null, 8>,
                {} as FixedSizeEncoder<bigint | number, 8>,
                {} as FixedSizeEncoder<{ value: string }, 8>,
                {} as FixedSizeEncoder<{ x: number; y: number }, 8>,
            ],
            getIndex,
        ) satisfies FixedSizeEncoder<bigint | number | { value: string } | { x: number; y: number } | null, 8>;
    }

    // It returns a variable size encoder if all variants are fixed size with different known sizes.
    {
        const encoder = getUnionEncoder(
            [{} as FixedSizeEncoder<number, 1>, {} as FixedSizeEncoder<number, 4>],
            getIndex,
        );
        encoder satisfies VariableSizeEncoder<number>;
        // @ts-expect-error Known unequal fixed sizes make the union variable at runtime.
        encoder satisfies FixedSizeEncoder<number>;
    }

    // It returns an encoder if all variants are fixed size but their sizes are not known.
    {
        const encoder = getUnionEncoder([{} as FixedSizeEncoder<number>, {} as FixedSizeEncoder<number>], getIndex);
        encoder satisfies Encoder<number>;
        // @ts-expect-error The two runtime sizes may differ.
        encoder satisfies FixedSizeEncoder<number>;
        // @ts-expect-error The two runtime sizes may still match.
        encoder satisfies VariableSizeEncoder<number>;
    }

    // It returns an encoder if fixed-size variants carry ambiguous literal-union sizes.
    {
        const encoder = getUnionEncoder(
            [{} as FixedSizeEncoder<number, 1 | 4>, {} as FixedSizeEncoder<number, 1 | 4>],
            getIndex,
        );
        encoder satisfies Encoder<number>;
        // @ts-expect-error Each branch may resolve to the same runtime size.
        encoder satisfies VariableSizeEncoder<number>;
        // @ts-expect-error Each branch may resolve to different runtime sizes.
        encoder satisfies FixedSizeEncoder<number>;
    }

    // It keeps dynamic arrays fixed-size without promising one literal size.
    {
        const variants = [] as FixedSizeEncoder<number, 4>[];
        const encoder = getUnionEncoder(variants, getIndex);
        encoder satisfies FixedSizeEncoder<number>;
        // @ts-expect-error The array may be empty, whose runtime fixedSize is 0.
        encoder satisfies FixedSizeEncoder<number, 4>;
    }

    // It returns an encoder for dynamic arrays with ambiguous element sizes.
    {
        const variants = [] as FixedSizeEncoder<number, 1 | 4>[];
        const encoder = getUnionEncoder(variants, getIndex);
        encoder satisfies Encoder<number>;
        // @ts-expect-error Elements may share one runtime size or disagree.
        encoder satisfies FixedSizeEncoder<number>;
        // @ts-expect-error Elements may share one runtime size or disagree.
        encoder satisfies VariableSizeEncoder<number>;
    }

    // It returns an encoder for dynamic arrays of variable-size variants.
    {
        const variants = [] as VariableSizeEncoder<number>[];
        const encoder = getUnionEncoder(variants, getIndex);
        encoder satisfies Encoder<number>;
        // @ts-expect-error The array may be empty, whose runtime fixedSize is 0.
        encoder satisfies FixedSizeEncoder<number>;
        // @ts-expect-error The array may be non-empty, whose runtime is variable size.
        encoder satisfies VariableSizeEncoder<number>;
    }

    // It returns a variable size encoder if any known variant is variable size.
    {
        const encoder = getUnionEncoder([{} as VariableSizeEncoder<number>, {} as FixedSizeEncoder<number>], getIndex);
        encoder satisfies VariableSizeEncoder<number>;
        // @ts-expect-error The runtime helper cannot expose fixedSize in this case.
        encoder satisfies FixedSizeEncoder<number>;
    }

    // It returns a plain encoder when a variant's size is entirely unknown.
    {
        const encoder = getUnionEncoder([{} as Encoder<number>, {} as FixedSizeEncoder<number>], getIndex);
        encoder satisfies Encoder<number>;
        // @ts-expect-error An unknown-size variant may be fixed or variable at runtime.
        encoder satisfies FixedSizeEncoder<number>;
        // @ts-expect-error An unknown-size variant may be fixed or variable at runtime.
        encoder satisfies VariableSizeEncoder<number>;
    }
}

// [DESCRIBE] getUnionDecoder.
{
    // It constructs unions from a list of decoder variants.
    {
        getUnionDecoder(
            [
                {} as Decoder<null>,
                {} as Decoder<bigint | number>,
                {} as Decoder<{ value: string }>,
                {} as Decoder<{ x: number; y: number }>,
            ],
            getIndex,
        ) satisfies Decoder<bigint | number | { value: string } | { x: number; y: number } | null>;
    }

    // It returns a fixed size decoder if all variants are fixed size with the same size.
    {
        const decoder = getUnionDecoder(
            [
                {} as FixedSizeDecoder<null, 8>,
                {} as FixedSizeDecoder<bigint | number, 8>,
                {} as FixedSizeDecoder<{ value: string }, 8>,
                {} as FixedSizeDecoder<{ x: number; y: number }, 8>,
            ],
            getIndex,
        );
        decoder satisfies FixedSizeDecoder<bigint | number | { value: string } | { x: number; y: number } | null, 8>;
    }

    // It returns a variable size decoder if all variants are fixed size with different known sizes.
    {
        const decoder = getUnionDecoder(
            [{} as FixedSizeDecoder<number, 1>, {} as FixedSizeDecoder<number, 4>],
            getIndex,
        );
        decoder satisfies VariableSizeDecoder<number>;
        // @ts-expect-error Known unequal fixed sizes make the union variable at runtime.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It returns a decoder if all variants are fixed size but their sizes are not known.
    {
        const decoder = getUnionDecoder([{} as FixedSizeDecoder<number>, {} as FixedSizeDecoder<number>], getIndex);
        decoder satisfies Decoder<number>;
        // @ts-expect-error The two runtime sizes may differ.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It returns a decoder if fixed-size variants carry ambiguous literal-union sizes.
    {
        const decoder = getUnionDecoder(
            [{} as FixedSizeDecoder<number, 1 | 4>, {} as FixedSizeDecoder<number, 1 | 4>],
            getIndex,
        );
        decoder satisfies Decoder<number>;
        // @ts-expect-error Each branch may resolve to different runtime sizes.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It returns a decoder for dynamic arrays of variable-size variants.
    {
        const variants = [] as VariableSizeDecoder<number>[];
        const decoder = getUnionDecoder(variants, getIndex);
        decoder satisfies Decoder<number>;
        // @ts-expect-error The array may be non-empty, whose runtime is variable size.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It returns a variable size decoder if any known variant is variable size.
    {
        const decoder = getUnionDecoder([{} as VariableSizeDecoder<number>, {} as FixedSizeDecoder<number>], getIndex);
        decoder satisfies VariableSizeDecoder<number>;
        // @ts-expect-error The runtime helper cannot expose fixedSize in this case.
        decoder satisfies FixedSizeDecoder<number>;
    }
}

// [DESCRIBE] getUnionCodec.
{
    // It constructs unions from a list of codec variants.
    {
        getUnionCodec(
            [
                {} as Codec<null>,
                {} as Codec<bigint | number>,
                {} as Codec<{ value: string }>,
                {} as Codec<{ x: number; y: number }>,
            ],
            getIndex,
            getIndex,
        ) satisfies Codec<bigint | number | { value: string } | { x: number; y: number } | null>;
    }

    // It returns a fixed size codec if all variants are fixed size with the same size.
    {
        getUnionCodec(
            [
                {} as FixedSizeCodec<null, null, 8>,
                {} as FixedSizeCodec<bigint | number, bigint | number, 8>,
                {} as FixedSizeCodec<{ value: string }, { value: string }, 8>,
                {} as FixedSizeCodec<{ x: number; y: number }, { x: number; y: number }, 8>,
            ],
            getIndex,
            getIndex,
        ) satisfies FixedSizeCodec<
            bigint | number | { value: string } | { x: number; y: number } | null,
            bigint | number | { value: string } | { x: number; y: number } | null,
            8
        >;
    }

    // It returns a variable size codec if all variants are fixed size with different known sizes.
    {
        const codec = getUnionCodec(
            [{} as FixedSizeCodec<number, number, 1>, {} as FixedSizeCodec<number, number, 4>],
            getIndex,
            getIndex,
        );
        codec satisfies VariableSizeCodec<number>;
        // @ts-expect-error Known unequal fixed sizes make the union variable at runtime.
        codec satisfies FixedSizeCodec<number>;
    }

    // It returns a codec if all variants are fixed size but their sizes are not known.
    {
        const codec = getUnionCodec([{} as FixedSizeCodec<number>, {} as FixedSizeCodec<number>], getIndex, getIndex);
        codec satisfies Codec<number>;
        // @ts-expect-error The two runtime sizes may differ.
        codec satisfies FixedSizeCodec<number>;
        // @ts-expect-error The two runtime sizes may still match.
        codec satisfies VariableSizeCodec<number>;
    }

    // It returns a codec if fixed-size variants carry ambiguous literal-union sizes.
    {
        const codec = getUnionCodec(
            [{} as FixedSizeCodec<number, number, 1 | 4>, {} as FixedSizeCodec<number, number, 1 | 4>],
            getIndex,
            getIndex,
        );
        codec satisfies Codec<number>;
        // @ts-expect-error Each branch may resolve to the same runtime size.
        codec satisfies VariableSizeCodec<number>;
        // @ts-expect-error Each branch may resolve to different runtime sizes.
        codec satisfies FixedSizeCodec<number>;
    }

    // It returns a codec for dynamic arrays of variable-size variants.
    {
        const variants = [] as VariableSizeCodec<number>[];
        const codec = getUnionCodec(variants, getIndex, getIndex);
        codec satisfies Codec<number>;
        // @ts-expect-error The array may be empty, whose runtime fixedSize is 0.
        codec satisfies FixedSizeCodec<number>;
        // @ts-expect-error The array may be non-empty, whose runtime is variable size.
        codec satisfies VariableSizeCodec<number>;
    }

    // It returns a variable size codec if any known variant is variable size.
    {
        const codec = getUnionCodec(
            [{} as VariableSizeCodec<number>, {} as FixedSizeCodec<number>],
            getIndex,
            getIndex,
        );
        codec satisfies VariableSizeCodec<number>;
        // @ts-expect-error The runtime helper cannot expose fixedSize in this case.
        codec satisfies FixedSizeCodec<number>;
    }

    // It returns a plain codec when a variant's size is entirely unknown.
    {
        const codec = getUnionCodec([{} as Codec<number>, {} as FixedSizeCodec<number>], getIndex, getIndex);
        codec satisfies Codec<number>;
        // @ts-expect-error An unknown-size variant may be fixed or variable at runtime.
        codec satisfies FixedSizeCodec<number>;
        // @ts-expect-error An unknown-size variant may be fixed or variable at runtime.
        codec satisfies VariableSizeCodec<number>;
    }
}
