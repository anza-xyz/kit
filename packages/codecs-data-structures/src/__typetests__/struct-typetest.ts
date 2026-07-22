import {
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import {
    getU8Codec,
    getU8Decoder,
    getU8Encoder,
    getU32Codec,
    getU32Decoder,
    getU32Encoder,
} from '@solana/codecs-numbers';
import { getUtf8Codec, getUtf8Decoder, getUtf8Encoder } from '@solana/codecs-strings';

import { getStructCodec, getStructDecoder, getStructEncoder } from '../struct';

{
    // [getStructEncoder]: It knows if the encoder is fixed size or variable size.
    getStructEncoder([
        ['name', {} as FixedSizeEncoder<string>],
        ['age', {} as FixedSizeEncoder<number>],
    ]) satisfies FixedSizeEncoder<{ age: number; name: string }>;
    getStructEncoder([
        ['name', {} as VariableSizeEncoder<string>],
        ['age', {} as FixedSizeEncoder<number>],
    ]) satisfies VariableSizeEncoder<{ age: number; name: string }>;
    getStructEncoder([['age', getU32Encoder()]]) satisfies FixedSizeEncoder<{ age: number }>;
    getStructEncoder([['name', getUtf8Encoder()]]) satisfies VariableSizeEncoder<{ name: string }>;
}

{
    // [getStructDecoder]: It knows if the decoder is fixed size or variable size.
    getStructDecoder([
        ['name', {} as FixedSizeDecoder<string>],
        ['age', {} as FixedSizeDecoder<number>],
    ]) satisfies FixedSizeDecoder<{ age: number; name: string }>;
    getStructDecoder([
        ['name', {} as VariableSizeDecoder<string>],
        ['age', {} as FixedSizeDecoder<number>],
    ]) satisfies VariableSizeDecoder<{ age: number; name: string }>;
    getStructDecoder([['age', getU32Decoder()]]) satisfies FixedSizeDecoder<{ age: number }>;
    getStructDecoder([['name', getUtf8Decoder()]]) satisfies VariableSizeDecoder<{ name: string }>;
}

{
    // [getStructCodec]: It knows if the codec is fixed size or variable size.
    getStructCodec([
        ['name', {} as FixedSizeCodec<string>],
        ['age', {} as FixedSizeCodec<number>],
    ]) satisfies FixedSizeCodec<{ age: number; name: string }>;
    getStructCodec([
        ['name', {} as VariableSizeCodec<string>],
        ['age', {} as FixedSizeCodec<number>],
    ]) satisfies VariableSizeCodec<{ age: number; name: string }>;
    getStructCodec([['age', getU32Codec()]]) satisfies FixedSizeCodec<{ age: number }>;
    getStructCodec([['name', getUtf8Codec()]]) satisfies VariableSizeCodec<{ name: string }>;
}

{
    // [getStructEncoder]: It can infer complex struct types from fields.
    getStructEncoder([
        ['name', {} as VariableSizeEncoder<string>],
        ['id', {} as FixedSizeEncoder<bigint | number>],
        [
            'address',
            getStructEncoder([
                ['street', {} as VariableSizeEncoder<string>],
                ['city', {} as VariableSizeEncoder<string>],
                ['country', {} as VariableSizeEncoder<string>],
            ]),
        ],
    ]) satisfies VariableSizeEncoder<{
        address: { city: string; country: string; street: string };
        id: bigint | number;
        name: string;
    }>;
}

{
    // [getStructDecoder]: It can infer complex struct types from fields.
    getStructDecoder([
        ['name', {} as VariableSizeDecoder<string>],
        ['id', {} as FixedSizeDecoder<bigint>],
        [
            'address',
            getStructDecoder([
                ['street', {} as VariableSizeDecoder<string>],
                ['city', {} as VariableSizeDecoder<string>],
                ['country', {} as VariableSizeDecoder<string>],
            ]),
        ],
    ]) satisfies VariableSizeDecoder<{
        address: { city: string; country: string; street: string };
        id: bigint;
        name: string;
    }>;
}

{
    // [getStructCodec]: It can infer complex struct types from fields.
    getStructCodec([
        ['name', {} as VariableSizeCodec<string>],
        ['id', {} as FixedSizeCodec<bigint | number, bigint>],
        [
            'address',
            getStructCodec([
                ['street', {} as VariableSizeCodec<string>],
                ['city', {} as VariableSizeCodec<string>],
                ['country', {} as VariableSizeCodec<string>],
            ]),
        ],
    ]) satisfies VariableSizeCodec<
        {
            address: { city: string; country: string; street: string };
            id: bigint | number;
            name: string;
        },
        {
            address: { city: string; country: string; street: string };
            id: bigint;
            name: string;
        }
    >;
}

{
    // [getStructEncoder]: It infers a literal `fixedSize` from fixed-size fields (issue #1738).
    getStructEncoder([
        ['a', getU32Encoder()],
        ['b', getU8Encoder()],
    ]) satisfies FixedSizeEncoder<{ a: number; b: number }, 5>;
    getStructEncoder([['age', getU32Encoder()]]) satisfies FixedSizeEncoder<{ age: number }, 4>;
    // It falls back to a `number` size when a field's size is not a literal.
    getStructEncoder([['a', {} as FixedSizeEncoder<number>]]) satisfies FixedSizeEncoder<{ a: number }, number>;
    // @ts-expect-error It does not claim a literal size when a field's size is not a literal.
    getStructEncoder([['a', {} as FixedSizeEncoder<number>]]) satisfies FixedSizeEncoder<{ a: number }, 4>;
    // It falls back to a `number` size when the total exceeds the inference cap (no TS2589).
    getStructEncoder([['a', {} as FixedSizeEncoder<number, 1000>]]) satisfies FixedSizeEncoder<{ a: number }, number>;
    // @ts-expect-error It does not infer a literal size beyond the cap.
    getStructEncoder([['a', {} as FixedSizeEncoder<number, 1000>]]) satisfies FixedSizeEncoder<{ a: number }, 1000>;
}

{
    // [getStructDecoder]: It infers a literal `fixedSize` from fixed-size fields (issue #1738).
    getStructDecoder([
        ['a', getU32Decoder()],
        ['b', getU8Decoder()],
    ]) satisfies FixedSizeDecoder<{ a: number; b: number }, 5>;
}

{
    // [getStructCodec]: It infers a literal `fixedSize` from fixed-size fields (issue #1738).
    getStructCodec([
        ['a', getU32Codec()],
        ['b', getU8Codec()],
    ]) satisfies FixedSizeCodec<{ a: number; b: number }, { a: number; b: number }, 5>;
}
