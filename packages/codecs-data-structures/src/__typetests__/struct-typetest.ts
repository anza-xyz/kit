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

/**
 * Strict type-equality helper used by typetests below. Resolves to `true` only
 * if `A` and `B` are mutually assignable AND share the same modifier set (`?`,
 * `readonly`); otherwise resolves to `false`.
 *
 * This is stricter than `satisfies` for two reasons:
 *
 * 1. **Bidirectionality.** `A satisfies B` only checks that `A` is assignable
 *    to `B`. A test using `satisfies` passes if the actual type has extra
 *    members beyond what we asserted — which would silently mask a regression
 *    that re-introduced a nested `Omit<...>` wrapper, since `Omit<X, K> & A`
 *    is still structurally assignable to a flat literal.
 * 2. **Modifier strictness.** `A satisfies B` tolerates losing `?` (required
 *    is assignable to optional) and losing `readonly` (readonly is assignable
 *    to mutable). `Equal` distinguishes `{ x: T }` from `{ x?: T }` and from
 *    `{ readonly x: T }` because the inferred-position generic comparison
 *    uses identity rather than assignability for the type parameters.
 *
 * Use `Equal` when the exact shape (including modifiers) matters. Use
 * `satisfies` when one-way assignability is the actual requirement (e.g.
 * "this value is usable where `Disposable & X` is expected").
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

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
    // [getStructEncoder]: It forwards a second literal size without hard-coding the U32 size.
    getStructEncoder([['value', {} as FixedSizeEncoder<number, 8>]]) satisfies FixedSizeEncoder<{ value: number }, 8>;
}

{
    // [getStructDecoder]: It forwards a second literal size without hard-coding the U32 size.
    getStructDecoder([['value', {} as FixedSizeDecoder<number, 8>]]) satisfies FixedSizeDecoder<{ value: number }, 8>;
}

{
    // [getStructCodec]: It forwards a second literal size without hard-coding the U32 size.
    getStructCodec([['value', {} as FixedSizeCodec<number, number, 8>]]) satisfies FixedSizeCodec<
        { value: number },
        { value: number },
        8
    >;
}

{
    // [getStructEncoder]: Two fixed-size fields keep a widened size; it is not narrowed to a literal.
    const encoder = getStructEncoder([
        ['a', {} as FixedSizeEncoder<number, 4>],
        ['b', {} as FixedSizeEncoder<number, 8>],
    ]);
    encoder satisfies FixedSizeEncoder<{ a: number; b: number }>;
    true satisfies Equal<typeof encoder.fixedSize, number>;
}

{
    // [getStructDecoder]: Two fixed-size fields keep a widened size; it is not narrowed to a literal.
    const decoder = getStructDecoder([
        ['a', {} as FixedSizeDecoder<number, 4>],
        ['b', {} as FixedSizeDecoder<number, 8>],
    ]);
    decoder satisfies FixedSizeDecoder<{ a: number; b: number }>;
    true satisfies Equal<typeof decoder.fixedSize, number>;
}

{
    // [getStructCodec]: Two fixed-size fields keep a widened size; it is not narrowed to a literal.
    const codec = getStructCodec([
        ['a', {} as FixedSizeCodec<number, number, 4>],
        ['b', {} as FixedSizeCodec<number, number, 8>],
    ]);
    codec satisfies FixedSizeCodec<{ a: number; b: number }>;
    true satisfies Equal<typeof codec.fixedSize, number>;
}

{
    // [getStructEncoder]: A non-tuple field array keeps a widened size even when its items have a literal size.
    const fields: readonly (readonly [string, FixedSizeEncoder<number, 4>])[] = [];
    const encoder = getStructEncoder(fields);
    encoder.fixedSize satisfies number;
    true satisfies Equal<typeof encoder.fixedSize, number>;
}

{
    // [getStructDecoder]: A non-tuple field array keeps a widened size even when its items have a literal size.
    const fields: readonly (readonly [string, FixedSizeDecoder<number, 4>])[] = [];
    const decoder = getStructDecoder(fields);
    decoder.fixedSize satisfies number;
    true satisfies Equal<typeof decoder.fixedSize, number>;
}

{
    // [getStructCodec]: A non-tuple field array keeps a widened size even when its items have a literal size.
    const fields: readonly (readonly [string, FixedSizeCodec<number, number, 4>])[] = [];
    const codec = getStructCodec(fields);
    codec.fixedSize satisfies number;
    true satisfies Equal<typeof codec.fixedSize, number>;
}

{
    // [getStructEncoder]: An empty struct preserves its existing widened fixed-size classification.
    const encoder = getStructEncoder([]);
    encoder.fixedSize satisfies number;
    true satisfies Equal<typeof encoder.fixedSize, number>;
}

{
    // [getStructDecoder]: An empty struct preserves its existing widened fixed-size classification.
    const decoder = getStructDecoder([]);
    decoder.fixedSize satisfies number;
    true satisfies Equal<typeof decoder.fixedSize, number>;
}

{
    // [getStructCodec]: An empty struct preserves its existing widened fixed-size classification.
    const codec = getStructCodec([]);
    codec.fixedSize satisfies number;
    true satisfies Equal<typeof codec.fixedSize, number>;
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
