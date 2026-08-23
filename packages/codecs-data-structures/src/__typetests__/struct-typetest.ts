import {
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getU32Codec, getU32Decoder, getU32Encoder } from '@solana/codecs-numbers';
import { getUtf8Codec, getUtf8Decoder, getUtf8Encoder } from '@solana/codecs-strings';

import { getStructCodec, getStructDecoder, getStructEncoder } from '../struct';

type IsWidenedNumber<T extends number> = number extends T ? true : false;

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
    getStructEncoder([['age', getU32Encoder()]]) satisfies FixedSizeEncoder<{ age: bigint | number }, 4>;
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
    getStructDecoder([['age', getU32Decoder()]]) satisfies FixedSizeDecoder<{ age: number }, 4>;
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
    getStructCodec([['age', getU32Codec()]]) satisfies FixedSizeCodec<{ age: bigint | number }, { age: number }, 4>;
    getStructCodec([['name', getUtf8Codec()]]) satisfies VariableSizeCodec<{ name: string }>;
}

{
    // [getStructEncoder/Decoder/Codec]: It only preserves literal sizes for exactly one fixed-size field.
    {
        // It forwards a second literal size without hard-coding the U32 size.
        getStructEncoder([['value', {} as FixedSizeEncoder<number, 8>]]) satisfies FixedSizeEncoder<
            { value: number },
            8
        >;
        getStructDecoder([['value', {} as FixedSizeDecoder<number, 8>]]) satisfies FixedSizeDecoder<
            { value: number },
            8
        >;
        getStructCodec([['value', {} as FixedSizeCodec<number, number, 8>]]) satisfies FixedSizeCodec<
            { value: number },
            { value: number },
            8
        >;
    }

    {
        // Two fixed-size fields stay widened; their sizes are not added by the type system.
        const encoder = getStructEncoder([
            ['a', {} as FixedSizeEncoder<number, 4>],
            ['b', {} as FixedSizeEncoder<number, 8>],
        ]);
        const decoder = getStructDecoder([
            ['a', {} as FixedSizeDecoder<number, 4>],
            ['b', {} as FixedSizeDecoder<number, 8>],
        ]);
        const codec = getStructCodec([
            ['a', {} as FixedSizeCodec<number, number, 4>],
            ['b', {} as FixedSizeCodec<number, number, 8>],
        ]);
        [encoder.fixedSize, decoder.fixedSize, codec.fixedSize] satisfies number[];
        true satisfies IsWidenedNumber<typeof encoder.fixedSize>;
        true satisfies IsWidenedNumber<typeof decoder.fixedSize>;
        true satisfies IsWidenedNumber<typeof codec.fixedSize>;
    }

    {
        // Non-tuple field arrays stay widened even when their items have a literal size.
        const encoderFields: readonly (readonly [string, FixedSizeEncoder<number, 4>])[] = [];
        const decoderFields: readonly (readonly [string, FixedSizeDecoder<number, 4>])[] = [];
        const codecFields: readonly (readonly [string, FixedSizeCodec<number, number, 4>])[] = [];
        const encoder = getStructEncoder(encoderFields);
        const decoder = getStructDecoder(decoderFields);
        const codec = getStructCodec(codecFields);
        [encoder.fixedSize, decoder.fixedSize, codec.fixedSize] satisfies number[];
        true satisfies IsWidenedNumber<typeof encoder.fixedSize>;
        true satisfies IsWidenedNumber<typeof decoder.fixedSize>;
        true satisfies IsWidenedNumber<typeof codec.fixedSize>;
    }

    {
        // Empty structs preserve their existing widened fixed-size classification.
        const encoder = getStructEncoder([]);
        const decoder = getStructDecoder([]);
        const codec = getStructCodec([]);
        [encoder.fixedSize, decoder.fixedSize, codec.fixedSize] satisfies number[];
        true satisfies IsWidenedNumber<typeof encoder.fixedSize>;
        true satisfies IsWidenedNumber<typeof decoder.fixedSize>;
        true satisfies IsWidenedNumber<typeof codec.fixedSize>;
    }
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
