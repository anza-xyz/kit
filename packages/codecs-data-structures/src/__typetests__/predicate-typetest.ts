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

import { getPredicateCodec, getPredicateDecoder, getPredicateEncoder } from '../predicate';

const predicate = null as unknown as () => boolean;

// [DESCRIBE] getPredicateEncoder
{
    // It returns an encoder for the same type as the inputs
    getPredicateEncoder(predicate, {} as Encoder<number>, {} as Encoder<number>) satisfies Encoder<number>;

    // It returns an encoder if both fixed-size encoders have unknown sizes.
    {
        const encoder = getPredicateEncoder(predicate, {} as FixedSizeEncoder<number>, {} as FixedSizeEncoder<number>);
        encoder satisfies Encoder<number>;
        // @ts-expect-error The two runtime sizes may differ.
        encoder satisfies FixedSizeEncoder<number>;
        // @ts-expect-error The two runtime sizes may still match.
        encoder satisfies VariableSizeEncoder<number>;
    }

    // It returns an encoder if both fixed-size encoders carry ambiguous literal-union sizes.
    {
        const encoder = getPredicateEncoder(
            predicate,
            {} as FixedSizeEncoder<number, 1 | 4>,
            {} as FixedSizeEncoder<number, 1 | 4>,
        );
        encoder satisfies Encoder<number>;
        // @ts-expect-error Each branch may resolve to the same runtime size.
        encoder satisfies VariableSizeEncoder<number>;
        // @ts-expect-error Each branch may resolve to different runtime sizes.
        encoder satisfies FixedSizeEncoder<number>;
    }

    // It maintains the size if both encoders are FixedSizeEncoder with the same size
    getPredicateEncoder(
        predicate,
        {} as FixedSizeEncoder<string, 4>,
        {} as FixedSizeEncoder<string, 4>,
    ) satisfies FixedSizeEncoder<string, 4>;

    // It returns a variable size encoder if both encoders are fixed size with different known sizes.
    {
        const encoder = getPredicateEncoder(
            predicate,
            {} as FixedSizeEncoder<number, 1>,
            {} as FixedSizeEncoder<number, 4>,
        );
        encoder satisfies VariableSizeEncoder<number>;
        // @ts-expect-error Known unequal fixed sizes make the predicate encoder variable at runtime.
        encoder satisfies FixedSizeEncoder<number>;
    }

    // It returns a VariableSizeEncoder if both encoders are VariableSizeEncoder
    getPredicateEncoder(
        predicate,
        {} as VariableSizeEncoder<number>,
        {} as VariableSizeEncoder<number>,
    ) satisfies VariableSizeEncoder<number>;

    // It returns a VariableSizeEncoder if any known input encoder is VariableSizeEncoder
    getPredicateEncoder(
        predicate,
        {} as FixedSizeEncoder<number>,
        {} as VariableSizeEncoder<number>,
    ) satisfies VariableSizeEncoder<number>;

    getPredicateEncoder(
        predicate,
        {} as VariableSizeEncoder<number>,
        {} as FixedSizeEncoder<number>,
    ) satisfies VariableSizeEncoder<number>;

    // It does not allow different encoder types
    {
        // @ts-expect-error Different encoder types
        getPredicateEncoder(predicate, {} as Encoder<number>, {} as Encoder<string>);
    }
}

// [DESCRIBE] getPredicateDecoder
{
    // It returns an encoder for the same type as the inputs
    getPredicateDecoder(predicate, {} as Decoder<number>, {} as Decoder<number>) satisfies Decoder<number>;

    // It returns a decoder if both fixed-size decoders have unknown sizes.
    {
        const decoder = getPredicateDecoder(predicate, {} as FixedSizeDecoder<number>, {} as FixedSizeDecoder<number>);
        decoder satisfies Decoder<number>;
        // @ts-expect-error The two runtime sizes may differ.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It returns a decoder if both fixed-size decoders carry ambiguous literal-union sizes.
    {
        const decoder = getPredicateDecoder(
            predicate,
            {} as FixedSizeDecoder<number, 1 | 4>,
            {} as FixedSizeDecoder<number, 1 | 4>,
        );
        decoder satisfies Decoder<number>;
        // @ts-expect-error Each branch may resolve to different runtime sizes.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It maintains the size if both decoders are FixedSizeDecoder with the same size
    getPredicateDecoder(
        predicate,
        {} as FixedSizeDecoder<string, 4>,
        {} as FixedSizeDecoder<string, 4>,
    ) satisfies FixedSizeDecoder<string, 4>;

    // It returns a variable size decoder if both decoders are fixed size with different known sizes.
    {
        const decoder = getPredicateDecoder(
            predicate,
            {} as FixedSizeDecoder<number, 1>,
            {} as FixedSizeDecoder<number, 4>,
        );
        decoder satisfies VariableSizeDecoder<number>;
        // @ts-expect-error Known unequal fixed sizes make the predicate decoder variable at runtime.
        decoder satisfies FixedSizeDecoder<number>;
    }

    // It returns a VariableSizeDecoder if both decoders are VariableSizeDecoder
    getPredicateDecoder(
        predicate,
        {} as VariableSizeDecoder<number>,
        {} as VariableSizeDecoder<number>,
    ) satisfies VariableSizeDecoder<number>;

    // It returns a VariableSizeDecoder if any known input decoder is VariableSizeDecoder
    getPredicateDecoder(
        predicate,
        {} as FixedSizeDecoder<number>,
        {} as VariableSizeDecoder<number>,
    ) satisfies VariableSizeDecoder<number>;

    getPredicateDecoder(
        predicate,
        {} as VariableSizeDecoder<number>,
        {} as FixedSizeDecoder<number>,
    ) satisfies VariableSizeDecoder<number>;

    // It does not allow different Decoder types
    {
        // @ts-expect-error Different Decoder types
        getPredicateDecoder(predicate, {} as Decoder<number>, {} as Decoder<string>);
    }
}

// [DESCRIBE] getPredicateCodec
{
    // It returns a codec for the same type as the inputs
    getPredicateCodec(predicate, predicate, {} as Codec<number>, {} as Codec<number>) satisfies Codec<number>;

    // It returns a codec if both fixed-size codecs have unknown sizes.
    {
        const codec = getPredicateCodec(
            predicate,
            predicate,
            {} as FixedSizeCodec<number>,
            {} as FixedSizeCodec<number>,
        );
        codec satisfies Codec<number>;
        // @ts-expect-error The two runtime sizes may differ.
        codec satisfies FixedSizeCodec<number>;
        // @ts-expect-error The two runtime sizes may still match.
        codec satisfies VariableSizeCodec<number>;
    }

    // It returns a codec if both fixed-size codecs carry ambiguous literal-union sizes.
    {
        const codec = getPredicateCodec(
            predicate,
            predicate,
            {} as FixedSizeCodec<number, number, 1 | 4>,
            {} as FixedSizeCodec<number, number, 1 | 4>,
        );
        codec satisfies Codec<number>;
        // @ts-expect-error Each branch may resolve to the same runtime size.
        codec satisfies VariableSizeCodec<number>;
        // @ts-expect-error Each branch may resolve to different runtime sizes.
        codec satisfies FixedSizeCodec<number>;
    }

    // It maintains the size if both codecs are FixedSizeCodec with the same size
    getPredicateCodec(
        predicate,
        predicate,
        {} as FixedSizeCodec<string, string, 4>,
        {} as FixedSizeCodec<string, string, 4>,
    ) satisfies FixedSizeCodec<string, string, 4>;

    // It returns a variable size codec if both codecs are fixed size with different known sizes.
    {
        const codec = getPredicateCodec(
            predicate,
            predicate,
            {} as FixedSizeCodec<number, number, 1>,
            {} as FixedSizeCodec<number, number, 4>,
        );
        codec satisfies VariableSizeCodec<number>;
        // @ts-expect-error Known unequal fixed sizes make the predicate codec variable at runtime.
        codec satisfies FixedSizeCodec<number>;
    }

    // It returns a VariableSizeCodec if both codecs are VariableSizeCodec
    getPredicateCodec(
        predicate,
        predicate,
        {} as VariableSizeCodec<number>,
        {} as VariableSizeCodec<number>,
    ) satisfies VariableSizeCodec<number>;

    // It returns a VariableSizeCodec if any known input codec is VariableSizeCodec
    getPredicateCodec(
        predicate,
        predicate,
        {} as FixedSizeCodec<number>,
        {} as VariableSizeCodec<number>,
    ) satisfies VariableSizeCodec<number>;

    getPredicateCodec(
        predicate,
        predicate,
        {} as VariableSizeCodec<number>,
        {} as FixedSizeCodec<number>,
    ) satisfies VariableSizeCodec<number>;

    // It does not allow different codec types
    {
        // @ts-expect-error Different codec types
        getPredicateCodec(predicate, predicate, {} as Codec<number>, {} as Codec<string>);
    }
}
