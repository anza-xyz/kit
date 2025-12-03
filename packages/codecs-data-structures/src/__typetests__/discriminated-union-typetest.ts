import { Codec, Decoder, Encoder, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';
import { getU64Codec } from '@solana/codecs-numbers';

import {
    getDiscriminatedUnionCodec,
    getDiscriminatedUnionDecoder,
    getDiscriminatedUnionEncoder,
} from '../discriminated-union';
import { getStructCodec } from '../struct';
import { getUnitCodec } from '../unit';

// [DESCRIBE] getDiscriminatedUnionEncoder.
{
    // It constructs discriminated unions from a list of encoder variants.
    {
        getDiscriminatedUnionEncoder([
            ['A', {} as Encoder<{ value: string }>],
            ['B', {} as Encoder<{ x: number; y: number }>],
        ]) satisfies Encoder<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }

    // It can use a custom discriminator property.
    {
        getDiscriminatedUnionEncoder(
            [
                ['A', {} as Encoder<{ value: string }>],
                ['B', {} as Encoder<{ x: number; y: number }>],
            ],
            { discriminator: 'myType' },
        ) satisfies Encoder<{ myType: 'A'; value: string } | { myType: 'B'; x: number; y: number }>;
    }

    // It can use numbers as discriminator values.
    {
        getDiscriminatedUnionEncoder([
            [1, {} as Encoder<{ value: string }>],
            [2, {} as Encoder<{ x: number; y: number }>],
        ]) satisfies Encoder<{ __kind: 1; value: string } | { __kind: 2; x: number; y: number }>;
    }

    // It can use enums as discriminator values.
    {
        const enum Event {
            Click,
            KeyPress,
        }
        getDiscriminatedUnionEncoder([
            [Event.Click, {} as Encoder<{ x: number; y: number }>],
            [Event.KeyPress, {} as Encoder<{ key: string }>],
        ]) satisfies Encoder<{ __kind: Event.Click; x: number; y: number } | { __kind: Event.KeyPress; key: string }>;
    }

    // It returns a fixed size encoder if all variants are fixed size.
    {
        getDiscriminatedUnionEncoder([
            ['A', {} as FixedSizeEncoder<{ value: string }>],
            ['B', {} as FixedSizeEncoder<{ x: number; y: number }>],
        ]) satisfies FixedSizeEncoder<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }

    // It does not return a fixed size encoder if any variant is variable size.
    {
        const encoder = getDiscriminatedUnionEncoder([
            ['A', {} as Encoder<{ value: string }>],
            ['B', {} as FixedSizeEncoder<{ x: number; y: number }>],
        ]);
        encoder satisfies Encoder<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
        // @ts-expect-error Encoder is not fixed size.
        encoder satisfies FixedSizeEncoder<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }
}

// [DESCRIBE] getDiscriminatedUnionDecoder.
{
    // It constructs discriminated unions from a list of decoder variants.
    {
        getDiscriminatedUnionDecoder([
            ['A', {} as Decoder<{ value: string }>],
            ['B', {} as Decoder<{ x: number; y: number }>],
        ]) satisfies Decoder<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }

    // It can use a custom discriminator property.
    {
        getDiscriminatedUnionDecoder(
            [
                ['A', {} as Decoder<{ value: string }>],
                ['B', {} as Decoder<{ x: number; y: number }>],
            ],
            { discriminator: 'myType' },
        ) satisfies Decoder<{ myType: 'A'; value: string } | { myType: 'B'; x: number; y: number }>;
    }

    // It can use numbers as discriminator values.
    {
        getDiscriminatedUnionDecoder([
            [1, {} as Decoder<{ value: string }>],
            [2, {} as Decoder<{ x: number; y: number }>],
        ]) satisfies Decoder<{ __kind: 1; value: string } | { __kind: 2; x: number; y: number }>;
    }

    // It can use enums as discriminator values.
    {
        const enum Event {
            Click,
            KeyPress,
        }
        getDiscriminatedUnionDecoder([
            [Event.Click, {} as Decoder<{ x: number; y: number }>],
            [Event.KeyPress, {} as Decoder<{ key: string }>],
        ]) satisfies Decoder<{ __kind: Event.Click; x: number; y: number } | { __kind: Event.KeyPress; key: string }>;
    }

    // It returns a fixed size decoder if all variants are fixed size.
    {
        getDiscriminatedUnionDecoder([
            ['A', {} as FixedSizeDecoder<{ value: string }>],
            ['B', {} as FixedSizeDecoder<{ x: number; y: number }>],
        ]) satisfies FixedSizeDecoder<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }

    // It does not return a fixed size decoder if any variant is variable size.
    {
        const decoder = getDiscriminatedUnionDecoder([
            ['A', {} as Decoder<{ value: string }>],
            ['B', {} as FixedSizeDecoder<{ x: number; y: number }>],
        ]);
        decoder satisfies Decoder<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
        // @ts-expect-error Decoder is not fixed size.
        decoder satisfies FixedSizeDecoder<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }
}

// [DESCRIBE] getDiscriminatedUnionCodec.
{
    // It constructs discriminated unions from a list of codec variants.
    {
        getDiscriminatedUnionCodec([
            ['A', {} as Codec<{ value: string }>],
            ['B', {} as Codec<{ x: number; y: number }>],
        ]) satisfies Codec<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }

    // It can use a custom discriminator property.
    {
        getDiscriminatedUnionCodec(
            [
                ['A', {} as Codec<{ value: string }>],
                ['B', {} as Codec<{ x: number; y: number }>],
            ],
            { discriminator: 'myType' },
        ) satisfies Codec<{ myType: 'A'; value: string } | { myType: 'B'; x: number; y: number }>;
    }

    // It can use numbers as discriminator values.
    {
        getDiscriminatedUnionCodec([
            [1, {} as Codec<{ value: string }>],
            [2, {} as Codec<{ x: number; y: number }>],
        ]) satisfies Codec<{ __kind: 1; value: string } | { __kind: 2; x: number; y: number }>;
    }

    // It can use enums as discriminator values.
    {
        const enum Event {
            Click,
            KeyPress,
        }
        getDiscriminatedUnionCodec([
            [Event.Click, {} as Codec<{ x: number; y: number }>],
            [Event.KeyPress, {} as Codec<{ key: string }>],
        ]) satisfies Codec<{ __kind: Event.Click; x: number; y: number } | { __kind: Event.KeyPress; key: string }>;
    }

    // It can infer complex discriminated union types from provided variants.
    {
        getDiscriminatedUnionCodec(
            [
                ['PageLoad', {} as Codec<void>],
                [
                    'Click',
                    getStructCodec([
                        ['x', {} as Codec<number>],
                        ['y', {} as Codec<number>],
                    ]),
                ],
                ['KeyPress', getStructCodec([['fields', {} as Codec<[string]>]])],
                ['PageUnload', {} as Codec<object>],
            ],
            { discriminator: 'event' },
        ) satisfies Codec<
            | { event: 'Click'; x: number; y: number }
            | { event: 'KeyPress'; fields: [string] }
            | { event: 'PageLoad' }
            | { event: 'PageUnload' }
        >;
    }

    // It can infer codec discriminated union with different from and to types.
    {
        getDiscriminatedUnionCodec([
            ['A', getUnitCodec()],
            ['B', getStructCodec([['value', getU64Codec()]])],
        ]) satisfies Codec<
            { __kind: 'A' } | { __kind: 'B'; value: bigint | number },
            { __kind: 'A' } | { __kind: 'B'; value: bigint }
        >;
    }

    // It returns a fixed size codec if all variants are fixed size.
    {
        getDiscriminatedUnionCodec([
            ['A', {} as FixedSizeCodec<{ value: string }>],
            ['B', {} as FixedSizeCodec<{ x: number; y: number }>],
        ]) satisfies FixedSizeCodec<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }

    // It does not return a fixed size codec if any variant is variable size.
    {
        const codec = getDiscriminatedUnionCodec([
            ['A', {} as Codec<{ value: string }>],
            ['B', {} as FixedSizeCodec<{ x: number; y: number }>],
        ]);
        codec satisfies Codec<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
        // @ts-expect-error Codec is not fixed size.
        codec satisfies FixedSizeCodec<{ __kind: 'A'; value: string } | { __kind: 'B'; x: number; y: number }>;
    }
}
