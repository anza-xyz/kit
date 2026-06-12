import {
    Codec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import { getPatternMatchCodec, getPatternMatchDecoder, getPatternMatchEncoder } from '../pattern-match';

const numberValuePredicate = null as unknown as (value: number) => boolean;
const stringValuePredicate = null as unknown as (value: string) => boolean;
const bytesPredicate = null as unknown as (bytes: ReadonlyUint8Array) => boolean;

const numberTypePredicate = null as unknown as (value: number | string) => value is number;
const stringTypePredicate = null as unknown as (value: number | string) => value is string;

// [DESCRIBE] getPatternMatchEncoder
{
    // [DESCRIBE] For boolean predicates
    {
        // It returns an encoder for the same type as the inputs
        getPatternMatchEncoder([[numberValuePredicate, {} as Encoder<number>]]) satisfies Encoder<number>;

        // It does not allow mixing incompatible value types across boolean-predicate branches
        getPatternMatchEncoder(
            // @ts-expect-error A string branch is not compatible with a number-typed pattern match.
            [
                [numberValuePredicate, {} as Encoder<number>],
                [stringValuePredicate, {} as Encoder<string>],
            ],
        );

        // It returns an encoder if all fixed-size encoders have unknown sizes.
        {
            const encoder = getPatternMatchEncoder([
                [numberValuePredicate, {} as FixedSizeEncoder<number>],
                [numberValuePredicate, {} as FixedSizeEncoder<number>],
            ]);
            encoder satisfies Encoder<number>;
            // @ts-expect-error The runtime sizes may differ between matched branches.
            encoder satisfies FixedSizeEncoder<number>;
            // @ts-expect-error The runtime sizes may differ between matched branches.
            encoder satisfies VariableSizeEncoder<number>;
        }

        // It returns an encoder if fixed-size encoders carry ambiguous literal-union sizes.
        {
            const encoder = getPatternMatchEncoder([
                [numberValuePredicate, {} as FixedSizeEncoder<number, 1 | 4>],
                [numberValuePredicate, {} as FixedSizeEncoder<number, 1 | 4>],
            ]);
            encoder satisfies Encoder<number>;
            // @ts-expect-error Each branch may resolve to the same runtime size.
            encoder satisfies VariableSizeEncoder<number>;
            // @ts-expect-error Each branch may resolve to different runtime sizes.
            encoder satisfies FixedSizeEncoder<number>;
        }

        // It maintains the size if all encoders are FixedSizeEncoder with the same size
        getPatternMatchEncoder([
            [stringValuePredicate, {} as FixedSizeEncoder<string, 4>],
            [stringValuePredicate, {} as FixedSizeEncoder<string, 4>],
        ]) satisfies FixedSizeEncoder<string, 4>;

        // It returns a variable size encoder if all variants are fixed size with different known sizes.
        {
            const encoder = getPatternMatchEncoder([
                [numberValuePredicate, {} as FixedSizeEncoder<number, 1>],
                [numberValuePredicate, {} as FixedSizeEncoder<number, 4>],
            ]);
            encoder satisfies VariableSizeEncoder<number>;
            // @ts-expect-error Known unequal fixed sizes make the union variable at runtime.
            encoder satisfies FixedSizeEncoder<number>;
        }

        // It returns a VariableSizeEncoder if all encoders are VariableSizeEncoder
        getPatternMatchEncoder([
            [numberValuePredicate, {} as VariableSizeEncoder<number>],
            [numberValuePredicate, {} as VariableSizeEncoder<number>],
        ]) satisfies VariableSizeEncoder<number>;

        // It returns a variable size encoder if any known variant is variable size.
        {
            const encoder = getPatternMatchEncoder([
                [numberValuePredicate, {} as FixedSizeEncoder<number>],
                [numberValuePredicate, {} as VariableSizeEncoder<number>],
            ]);
            encoder satisfies VariableSizeEncoder<number>;
            // @ts-expect-error A variable-size branch makes the union variable at runtime.
            encoder satisfies FixedSizeEncoder<number>;
        }
        {
            const encoder = getPatternMatchEncoder([
                [numberValuePredicate, {} as VariableSizeEncoder<number>],
                [numberValuePredicate, {} as FixedSizeEncoder<number>],
            ]);
            encoder satisfies VariableSizeEncoder<number>;
            // @ts-expect-error A variable-size branch makes the union variable at runtime.
            encoder satisfies FixedSizeEncoder<number>;
        }

        // It returns a plain encoder when a branch's size is entirely unknown.
        {
            const encoder = getPatternMatchEncoder([
                [numberValuePredicate, {} as Encoder<number>],
                [numberValuePredicate, {} as FixedSizeEncoder<number>],
            ]);
            encoder satisfies Encoder<number>;
            // @ts-expect-error An unknown-size branch may be fixed or variable at runtime.
            encoder satisfies FixedSizeEncoder<number>;
            // @ts-expect-error An unknown-size branch may be fixed or variable at runtime.
            encoder satisfies VariableSizeEncoder<number>;
        }

        // It infers the union value type from inline arrow predicates over distinct per-branch
        // encoders (mirroring real call sites such as getCompiledTransactionMessageEncoder, whose
        // branches each encode a different member of a discriminated union).
        {
            type Legacy = { data: number; version: 'legacy' };
            type V0 = { data: string; version: 0 };
            const encoder = getPatternMatchEncoder([
                [(m: Legacy | V0) => m.version === 'legacy', {} as VariableSizeEncoder<Legacy>],
                [(m: Legacy | V0) => m.version === 0, {} as VariableSizeEncoder<V0>],
            ]);
            encoder satisfies VariableSizeEncoder<Legacy | V0>;
        }
    }

    // [DESCRIBE] For type guard predicates
    {
        // It returns an encoder for the same type as the inputs
        getPatternMatchEncoder([
            [numberTypePredicate, {} as Encoder<number>],
            [stringTypePredicate, {} as Encoder<string>],
        ]) satisfies Encoder<number | string>;

        // It returns an encoder if all fixed-size encoders have unknown sizes.
        {
            const encoder = getPatternMatchEncoder([
                [numberTypePredicate, {} as FixedSizeEncoder<number>],
                [stringTypePredicate, {} as FixedSizeEncoder<string>],
            ]);
            encoder satisfies Encoder<number | string>;
            // @ts-expect-error The runtime sizes may differ between narrowed branches.
            encoder satisfies FixedSizeEncoder<number | string>;
        }

        // It maintains the size if all encoders are FixedSizeEncoder with the same size
        getPatternMatchEncoder([
            [numberTypePredicate, {} as FixedSizeEncoder<number, 4>],
            [stringTypePredicate, {} as FixedSizeEncoder<string, 4>],
        ]) satisfies FixedSizeEncoder<number | string, 4>;

        // It returns a variable size encoder if all variants are fixed size with different known sizes.
        {
            const encoder = getPatternMatchEncoder([
                [numberTypePredicate, {} as FixedSizeEncoder<number, 1>],
                [stringTypePredicate, {} as FixedSizeEncoder<string, 4>],
            ]);
            encoder satisfies VariableSizeEncoder<number | string>;
            // @ts-expect-error Known unequal fixed sizes make the union variable at runtime.
            encoder satisfies FixedSizeEncoder<number | string>;
        }

        // It returns a VariableSizeEncoder if all encoders are VariableSizeEncoder
        getPatternMatchEncoder([
            [numberTypePredicate, {} as VariableSizeEncoder<number>],
            [stringTypePredicate, {} as VariableSizeEncoder<string>],
        ]) satisfies VariableSizeEncoder<number | string>;

        // It returns a variable size encoder if any known variant is variable size.
        {
            const encoder = getPatternMatchEncoder([
                [numberTypePredicate, {} as FixedSizeEncoder<number>],
                [stringTypePredicate, {} as VariableSizeEncoder<string>],
            ]);
            encoder satisfies VariableSizeEncoder<number | string>;
            // @ts-expect-error A variable-size branch makes the union variable at runtime.
            encoder satisfies FixedSizeEncoder<number | string>;
        }
        {
            const encoder = getPatternMatchEncoder([
                [numberTypePredicate, {} as VariableSizeEncoder<number>],
                [numberTypePredicate, {} as FixedSizeEncoder<number>],
            ]);
            encoder satisfies VariableSizeEncoder<number>;
            // @ts-expect-error A variable-size branch makes the union variable at runtime.
            encoder satisfies FixedSizeEncoder<number>;
        }

        // It returns a plain encoder when a branch's size is entirely unknown.
        {
            const encoder = getPatternMatchEncoder([
                [numberTypePredicate, {} as Encoder<number>],
                [stringTypePredicate, {} as FixedSizeEncoder<string>],
            ]);
            encoder satisfies Encoder<number | string>;
            // @ts-expect-error An unknown-size branch may be fixed or variable at runtime.
            encoder satisfies FixedSizeEncoder<number | string>;
            // @ts-expect-error An unknown-size branch may be fixed or variable at runtime.
            encoder satisfies VariableSizeEncoder<number | string>;
        }
    }
}

// [DESCRIBE] getPatternMatchDecoder
{
    // It returns a decoder for the same type as the inputs
    getPatternMatchDecoder([[bytesPredicate, {} as Decoder<number>]]) satisfies Decoder<number>;

    // It returns a decoder if all fixed-size decoders have unknown sizes.
    {
        const decoder = getPatternMatchDecoder([
            [bytesPredicate, {} as FixedSizeDecoder<number>],
            [bytesPredicate, {} as FixedSizeDecoder<number>],
        ]);
        decoder satisfies Decoder<number>;
        // @ts-expect-error The runtime sizes may differ between matched branches.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It returns a decoder if fixed-size decoders carry ambiguous literal-union sizes.
    {
        const decoder = getPatternMatchDecoder([
            [bytesPredicate, {} as FixedSizeDecoder<number, 1 | 4>],
            [bytesPredicate, {} as FixedSizeDecoder<number, 1 | 4>],
        ]);
        decoder satisfies Decoder<number>;
        // @ts-expect-error Each branch may resolve to different runtime sizes.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It maintains the size if all decoders are FixedSizeDecoder with the same size
    getPatternMatchDecoder([
        [bytesPredicate, {} as FixedSizeDecoder<string, 4>],
        [bytesPredicate, {} as FixedSizeDecoder<string, 4>],
    ]) satisfies FixedSizeDecoder<string, 4>;

    // It returns a variable size decoder if all variants are fixed size with different known sizes.
    {
        const decoder = getPatternMatchDecoder([
            [bytesPredicate, {} as FixedSizeDecoder<number, 1>],
            [bytesPredicate, {} as FixedSizeDecoder<number, 4>],
        ]);
        decoder satisfies VariableSizeDecoder<number>;
        // @ts-expect-error Known unequal fixed sizes make the union variable at runtime.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It returns a VariableSizeDecoder if all decoders are VariableSizeDecoder
    getPatternMatchDecoder([
        [bytesPredicate, {} as VariableSizeDecoder<number>],
        [bytesPredicate, {} as VariableSizeDecoder<number>],
    ]) satisfies VariableSizeDecoder<number>;

    // It returns a variable size decoder if any known variant is variable size.
    {
        const decoder = getPatternMatchDecoder([
            [bytesPredicate, {} as FixedSizeDecoder<number>],
            [bytesPredicate, {} as VariableSizeDecoder<number>],
        ]);
        decoder satisfies VariableSizeDecoder<number>;
        // @ts-expect-error A variable-size branch makes the union variable at runtime.
        decoder satisfies FixedSizeDecoder<number>;
    }
    {
        const decoder = getPatternMatchDecoder([
            [bytesPredicate, {} as VariableSizeDecoder<number>],
            [bytesPredicate, {} as FixedSizeDecoder<number>],
        ]);
        decoder satisfies VariableSizeDecoder<number>;
        // @ts-expect-error A variable-size branch makes the union variable at runtime.
        decoder satisfies FixedSizeDecoder<number>;
    }
}

// [DESCRIBE] getPatternMatchCodec
{
    // [DESCRIBE] For boolean predicates
    {
        // It returns a codec for the same type as the inputs
        getPatternMatchCodec([[numberValuePredicate, bytesPredicate, {} as Codec<number>]]) satisfies Codec<number>;

        // It does not allow mixing incompatible value types across boolean-predicate branches
        getPatternMatchCodec(
            // @ts-expect-error A string branch is not compatible with a number-typed pattern match.
            [
                [numberValuePredicate, bytesPredicate, {} as Codec<number>],
                [stringValuePredicate, bytesPredicate, {} as Codec<string>],
            ],
        );

        // It returns a codec if all fixed-size codecs have unknown sizes.
        {
            const codec = getPatternMatchCodec([
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
            ]);
            codec satisfies Codec<number>;
            // @ts-expect-error The runtime sizes may differ between matched branches.
            codec satisfies FixedSizeCodec<number>;
        }

        // It returns a codec if fixed-size codecs carry ambiguous literal-union sizes.
        {
            const codec = getPatternMatchCodec([
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number, number, 1 | 4>],
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number, number, 1 | 4>],
            ]);
            codec satisfies Codec<number>;
            // @ts-expect-error Each branch may resolve to the same runtime size.
            codec satisfies VariableSizeCodec<number>;
            // @ts-expect-error Each branch may resolve to different runtime sizes.
            codec satisfies FixedSizeCodec<number>;
        }

        // It maintains the size if all codecs are FixedSizeCodec with the same size
        getPatternMatchCodec([
            [stringValuePredicate, bytesPredicate, {} as FixedSizeCodec<string, string, 4>],
            [stringValuePredicate, bytesPredicate, {} as FixedSizeCodec<string, string, 4>],
        ]) satisfies FixedSizeCodec<string, string, 4>;

        // It returns a variable size codec if all variants are fixed size with different known sizes.
        {
            const codec = getPatternMatchCodec([
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number, number, 1>],
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number, number, 4>],
            ]);
            codec satisfies VariableSizeCodec<number>;
            // @ts-expect-error Known unequal fixed sizes make the union variable at runtime.
            codec satisfies FixedSizeCodec<number>;
        }

        // It returns a VariableSizeCodec if all codecs are VariableSizeCodec
        getPatternMatchCodec([
            [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
            [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
        ]) satisfies VariableSizeCodec<number>;

        // It returns a variable size codec if any known variant is variable size.
        {
            const codec = getPatternMatchCodec([
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
                [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
            ]);
            codec satisfies VariableSizeCodec<number>;
            // @ts-expect-error A variable-size branch makes the union variable at runtime.
            codec satisfies FixedSizeCodec<number>;
        }
        {
            const codec = getPatternMatchCodec([
                [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
            ]);
            codec satisfies VariableSizeCodec<number>;
            // @ts-expect-error A variable-size branch makes the union variable at runtime.
            codec satisfies FixedSizeCodec<number>;
        }

        // It returns a plain codec when a branch's size is entirely unknown.
        {
            const codec = getPatternMatchCodec([
                [numberValuePredicate, bytesPredicate, {} as Codec<number>],
                [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
            ]);
            codec satisfies Codec<number>;
            // @ts-expect-error An unknown-size branch may be fixed or variable at runtime.
            codec satisfies FixedSizeCodec<number>;
            // @ts-expect-error An unknown-size branch may be fixed or variable at runtime.
            codec satisfies VariableSizeCodec<number>;
        }
    }

    // [DESCRIBE] For type guard predicates
    {
        // It returns a codec for the same type as the inputs
        getPatternMatchCodec([
            [numberTypePredicate, bytesPredicate, {} as Codec<number>],
            [stringTypePredicate, bytesPredicate, {} as Codec<string>],
        ]) satisfies Codec<number | string>;

        // It returns a codec if all fixed-size codecs have unknown sizes.
        {
            const codec = getPatternMatchCodec([
                [numberTypePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
                [stringTypePredicate, bytesPredicate, {} as FixedSizeCodec<string>],
            ]);
            codec satisfies Codec<number | string>;
            // @ts-expect-error The runtime sizes may differ between narrowed branches.
            codec satisfies FixedSizeCodec<number | string>;
        }

        // It maintains the size if all codecs are FixedSizeCodec with the same size
        getPatternMatchCodec([
            [stringTypePredicate, bytesPredicate, {} as FixedSizeCodec<string, string, 4>],
            [numberTypePredicate, bytesPredicate, {} as FixedSizeCodec<number, number, 4>],
        ]) satisfies FixedSizeCodec<number | string, number | string, 4>;

        // It returns a variable size codec if all variants are fixed size with different known sizes.
        {
            const codec = getPatternMatchCodec([
                [stringTypePredicate, bytesPredicate, {} as FixedSizeCodec<string, string, 1>],
                [numberTypePredicate, bytesPredicate, {} as FixedSizeCodec<number, number, 4>],
            ]);
            codec satisfies VariableSizeCodec<number | string>;
            // @ts-expect-error Known unequal fixed sizes make the union variable at runtime.
            codec satisfies FixedSizeCodec<number | string>;
        }

        // It returns a VariableSizeCodec if all codecs are VariableSizeCodec
        getPatternMatchCodec([
            [numberTypePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
            [stringTypePredicate, bytesPredicate, {} as VariableSizeCodec<string>],
        ]) satisfies VariableSizeCodec<number | string>;

        // It returns a variable size codec if any known variant is variable size.
        {
            const codec = getPatternMatchCodec([
                [numberTypePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
                [stringTypePredicate, bytesPredicate, {} as VariableSizeCodec<string>],
            ]);
            codec satisfies VariableSizeCodec<number | string>;
            // @ts-expect-error A variable-size branch makes the union variable at runtime.
            codec satisfies FixedSizeCodec<number | string>;
        }
        {
            const codec = getPatternMatchCodec([
                [numberTypePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
                [stringTypePredicate, bytesPredicate, {} as FixedSizeCodec<string>],
            ]);
            codec satisfies VariableSizeCodec<number | string>;
            // @ts-expect-error A variable-size branch makes the union variable at runtime.
            codec satisfies FixedSizeCodec<number | string>;
        }

        // It returns a plain codec when a branch's size is entirely unknown.
        {
            const codec = getPatternMatchCodec([
                [numberTypePredicate, bytesPredicate, {} as Codec<number>],
                [stringTypePredicate, bytesPredicate, {} as FixedSizeCodec<string>],
            ]);
            codec satisfies Codec<number | string>;
            // @ts-expect-error An unknown-size branch may be fixed or variable at runtime.
            codec satisfies FixedSizeCodec<number | string>;
            // @ts-expect-error An unknown-size branch may be fixed or variable at runtime.
            codec satisfies VariableSizeCodec<number | string>;
        }
    }
}
