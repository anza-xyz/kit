import { Decoder, VariableSizeDecoder } from '@solana/codecs-core';
import { getU8Decoder, getU16Decoder, getU32Decoder } from '@solana/codecs-numbers';
import { getUtf8Decoder } from '@solana/codecs-strings';

import { getArrayDecoder } from '../array';
import { createDependentStructDecoder } from '../dependent-struct';

{
    // [createDependentStructDecoder]: An empty builder finishes to a decoder for the empty record.
    createDependentStructDecoder().finish() satisfies VariableSizeDecoder<Record<never, never>>;
}

{
    // [createDependentStructDecoder]: A builder accumulates the type of each added field.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        .field('b', getU16Decoder())
        .field('c', getUtf8Decoder())
        .finish() satisfies VariableSizeDecoder<{ a: number; b: number; c: string }>;
}

{
    // [createDependentStructDecoder]: A field factory receives a snapshot of the fields added so far.
    createDependentStructDecoder()
        .field('count', getU8Decoder())
        .field('values', fields => {
            fields satisfies Readonly<{ count: number }>;
            return getArrayDecoder(getU32Decoder(), { size: fields.count });
        })
        .finish() satisfies VariableSizeDecoder<{ count: number; values: number[] }>;
}

{
    // [createDependentStructDecoder]: A field factory does not see fields that have not been added yet.
    createDependentStructDecoder()
        .field('first', getU8Decoder())
        .field('second', fields => {
            // @ts-expect-error `third` has not been added at this point.
            void fields.third;
            return getU8Decoder();
        })
        .field('third', getU8Decoder())
        .finish();
}

{
    // [createDependentStructDecoder]: Adding a field whose name already exists is a type error.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        // @ts-expect-error `a` has already been declared on this builder.
        .field('a', getU8Decoder());
}

{
    // [createDependentStructDecoder]: The finished decoder is assignable to a generic `Decoder`.
    const decoder = createDependentStructDecoder().field('value', getU8Decoder()).finish();
    decoder satisfies Decoder<{ value: number }>;
}

{
    // [createDependentStructDecoder]: A static decoder argument and a factory argument both type check.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        .field('b', () => getU8Decoder())
        .finish() satisfies VariableSizeDecoder<{ a: number; b: number }>;
}

{
    // [createDependentStructDecoder]: The result is always a `VariableSizeDecoder`, never a `FixedSizeDecoder`.
    const decoder = createDependentStructDecoder().field('a', getU8Decoder()).finish();
    decoder satisfies VariableSizeDecoder<{ a: number }>;
}
