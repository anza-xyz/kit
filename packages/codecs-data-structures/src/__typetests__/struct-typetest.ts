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
    getU64Encoder,
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
    // [getStructEncoder]: It sums the literal fixed sizes of its fields.
    getStructEncoder([['age', getU32Encoder()]]) satisfies FixedSizeEncoder<{ age: bigint | number }, 4>;
    getStructEncoder([
        ['a', getU32Encoder()],
        ['b', getU8Encoder()],
    ]) satisfies FixedSizeEncoder<{ a: bigint | number; b: bigint | number }, 5>;
    getStructEncoder([
        ['a', getU32Encoder()],
        ['b', getU64Encoder()],
        ['c', getU8Encoder()],
    ]) satisfies FixedSizeEncoder<{ a: bigint | number; b: bigint | number; c: bigint | number }, 13>;
}

{
    // [getStructEncoder]: It widens to `number` when a field size cannot be represented precisely.
    getStructEncoder([
        ['a', {} as FixedSizeEncoder<string>],
        ['b', getU8Encoder()],
    ]) satisfies FixedSizeEncoder<{ a: string; b: bigint | number }, number>;
    getStructEncoder([['a', {} as FixedSizeEncoder<string, 1 | 4>]]) satisfies FixedSizeEncoder<{ a: string }, number>;
}

{
    // [getStructDecoder]: It sums the literal fixed sizes of its fields.
    getStructDecoder([['age', getU32Decoder()]]) satisfies FixedSizeDecoder<{ age: number }, 4>;
    getStructDecoder([
        ['a', getU32Decoder()],
        ['b', getU8Decoder()],
    ]) satisfies FixedSizeDecoder<{ a: number; b: number }, 5>;
}

{
    // [getStructCodec]: It sums the literal fixed sizes of its fields.
    getStructCodec([['age', getU32Codec()]]) satisfies FixedSizeCodec<{ age: bigint | number }, { age: number }, 4>;
    getStructCodec([
        ['a', getU32Codec()],
        ['b', getU8Codec()],
    ]) satisfies FixedSizeCodec<{ a: bigint | number; b: bigint | number }, { a: number; b: number }, 5>;
}
