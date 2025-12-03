import { Codec, Decoder, Encoder, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

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

    // It returns a fixed size encoder if all variants are fixed size.
    {
        getUnionEncoder(
            [
                {} as FixedSizeEncoder<null>,
                {} as FixedSizeEncoder<bigint | number>,
                {} as FixedSizeEncoder<{ value: string }>,
                {} as FixedSizeEncoder<{ x: number; y: number }>,
            ],
            getIndex,
        ) satisfies FixedSizeEncoder<bigint | number | { value: string } | { x: number; y: number } | null>;
    }

    // It does not return a fixed size encoder if any variant is variable size.
    {
        const decoder = getUnionEncoder([{} as Encoder<number>, {} as FixedSizeEncoder<number>], getIndex);
        decoder satisfies Encoder<number>;
        // @ts-expect-error Encoder is not fixed size.
        decoder satisfies FixedSizeEncoder<number>;
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

    // It returns a fixed size decoder if all variants are fixed size.
    {
        const decoder = getUnionDecoder(
            [
                {} as FixedSizeDecoder<null>,
                {} as FixedSizeDecoder<bigint | number>,
                {} as FixedSizeDecoder<{ value: string }>,
                {} as FixedSizeDecoder<{ x: number; y: number }>,
            ],
            getIndex,
        );
        decoder satisfies FixedSizeDecoder<bigint | number | { value: string } | { x: number; y: number } | null>;
    }

    // It does not return a fixed size decoder if any variant is variable size.
    {
        const decoder = getUnionDecoder([{} as Decoder<number>, {} as FixedSizeDecoder<number>], getIndex);
        decoder satisfies Decoder<number>;
        // @ts-expect-error Decoder is not fixed size.
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

    // It returns a fixed size codec if all variants are fixed size.
    {
        getUnionCodec(
            [
                {} as FixedSizeCodec<null>,
                {} as FixedSizeCodec<bigint | number>,
                {} as FixedSizeCodec<{ value: string }>,
                {} as FixedSizeCodec<{ x: number; y: number }>,
            ],
            getIndex,
            getIndex,
        ) satisfies FixedSizeCodec<bigint | number | { value: string } | { x: number; y: number } | null>;
    }

    // It does not return a fixed size codec if any variant is variable size.
    {
        const codec = getUnionCodec([{} as Codec<number>, {} as FixedSizeCodec<number>], getIndex, getIndex);
        codec satisfies Codec<number>;
        // @ts-expect-error Codec is not fixed size.
        codec satisfies FixedSizeCodec<number>;
    }
}
