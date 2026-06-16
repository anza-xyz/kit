import { Decoder, FixedSizeDecoder, VariableSizeDecoder } from '@solana/codecs-core';
import { getU8Decoder, getU16Decoder, getU32Decoder } from '@solana/codecs-numbers';
import { getUtf8Decoder } from '@solana/codecs-strings';

import { getArrayDecoder } from '../array';
import { createDependentStructDecoder } from '../dependent-struct';

{
    // [createDependentStructDecoder]: An empty builder builds to a `FixedSizeDecoder` for the empty record.
    createDependentStructDecoder().build() satisfies FixedSizeDecoder<Record<never, never>>;
}

{
    // [createDependentStructDecoder]: A builder accumulates the type of each added field.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        .field('b', getU16Decoder())
        .field('c', getUtf8Decoder())
        .build() satisfies VariableSizeDecoder<{ a: number; b: number; c: string }>;
}

{
    // [createDependentStructDecoder]: A field factory receives a snapshot of the fields added so far.
    createDependentStructDecoder()
        .field('count', getU8Decoder())
        .field('values', fields => {
            fields satisfies Readonly<{ count: number }>;
            return getArrayDecoder(getU32Decoder(), { size: fields.count });
        })
        .build() satisfies VariableSizeDecoder<{ count: number; values: number[] }>;
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
        .build();
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
    const decoder = createDependentStructDecoder().field('value', getU8Decoder()).build();
    decoder satisfies Decoder<{ value: number }>;
}

{
    // [createDependentStructDecoder]: A static decoder argument and a factory argument both type check.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        .field('b', () => getU8Decoder())
        .build() satisfies VariableSizeDecoder<{ a: number; b: number }>;
}

{
    // [createDependentStructDecoder]: A builder built from only fixed size decoders produces a `FixedSizeDecoder`.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        .field('b', getU16Decoder())
        .field('c', getU32Decoder())
        .build() satisfies FixedSizeDecoder<{ a: number; b: number; c: number }>;
}

{
    // [createDependentStructDecoder]: Adding a variable size decoder demotes the builder to variable size.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        .field('b', getUtf8Decoder())
        .field('c', getU8Decoder())
        .build() satisfies VariableSizeDecoder<{ a: number; b: string; c: number }>;
}

{
    // [createDependentStructDecoder]: Adding a factory demotes the builder to variable size.
    createDependentStructDecoder()
        .field('count', getU8Decoder())
        .field('items', fields => getArrayDecoder(getU8Decoder(), { size: fields.count }))
        .build() satisfies VariableSizeDecoder<{ count: number; items: number[] }>;
}

{
    // [createDependentStructDecoder]: Once variable size, the builder stays variable size on subsequent additions.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        .field('b', getUtf8Decoder())
        .field('c', getU8Decoder())
        .build() satisfies VariableSizeDecoder<{ a: number; b: string; c: number }>;
    // A fixed size addition after a variable size addition does not raise the builder back to fixed size.
    createDependentStructDecoder()
        .field('a', getUtf8Decoder())
        .field('b', getU8Decoder())
        // @ts-expect-error The builder dropped to variable size; the result is not a `FixedSizeDecoder`.
        .build() satisfies FixedSizeDecoder<{ a: string; b: number }>;
}

{
    // [createDependentStructDecoder]: The accumulator widens correctly across many `field` calls.
    createDependentStructDecoder()
        .field('a', getU8Decoder())
        .field('b', getU8Decoder())
        .field('c', getU8Decoder())
        .field('d', getU8Decoder())
        .field('e', getU8Decoder())
        .field('f', getU8Decoder())
        .build() satisfies FixedSizeDecoder<{ a: number; b: number; c: number; d: number; e: number; f: number }>;
}

{
    // [createDependentStructDecoder]: A factory's `fields` parameter is read only.
    createDependentStructDecoder()
        .field('first', getU8Decoder())
        .field('second', fields => {
            // @ts-expect-error `fields.first` is read only and cannot be reassigned from inside a factory.
            fields.first = 0;
            return getU8Decoder();
        })
        .build();
}

{
    // [createDependentStructDecoder]: A factory can be typed in advance for its prior fields and still type check.
    const buildPayload = (fields: Readonly<{ version: number }>) =>
        fields.version === 0 ? getU16Decoder() : getU32Decoder();
    createDependentStructDecoder()
        .field('version', getU8Decoder())
        .field('payload', buildPayload)
        .build() satisfies VariableSizeDecoder<{ payload: number; version: number }>;
}

{
    // [createDependentStructDecoder]: The accumulator type is exact; unknown keys are not part of the finished decoder.
    const decoder = createDependentStructDecoder().field('a', getU8Decoder()).build();
    decoder satisfies FixedSizeDecoder<{ a: number }>;
    const value = null as unknown as Awaited<ReturnType<typeof decoder.decode>>;
    // @ts-expect-error `b` was never declared on the builder.
    void value.b;
}
