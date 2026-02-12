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

    // It returns a FixedSizeEncoder if both encoders are FixedSizeEncoder
    getPredicateEncoder(
        predicate,
        {} as FixedSizeEncoder<number>,
        {} as FixedSizeEncoder<number>,
    ) satisfies FixedSizeEncoder<number>;

    // It maintains the size if both encoders are FixedSizeEncoder with the same size
    getPredicateEncoder(
        predicate,
        {} as FixedSizeEncoder<string, 4>,
        {} as FixedSizeEncoder<string, 4>,
    ) satisfies FixedSizeEncoder<string, 4>;

    // It returns an Encoder if some input encoders are VariableSizeEncoder
    getPredicateEncoder(
        predicate,
        {} as VariableSizeEncoder<number>,
        {} as VariableSizeEncoder<number>,
    ) satisfies Encoder<number>;

    getPredicateEncoder(
        predicate,
        {} as FixedSizeEncoder<number>,
        {} as VariableSizeEncoder<number>,
    ) satisfies Encoder<number>;

    getPredicateEncoder(
        predicate,
        {} as VariableSizeEncoder<number>,
        {} as FixedSizeEncoder<number>,
    ) satisfies Encoder<number>;

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

    // It returns a FixedSizeDecoder if both Decoders are FixedSizeDecoder
    getPredicateDecoder(
        predicate,
        {} as FixedSizeDecoder<number>,
        {} as FixedSizeDecoder<number>,
    ) satisfies FixedSizeDecoder<number>;

    // It maintains the size if both decoders are FixedSizeDecoder with the same size
    getPredicateDecoder(
        predicate,
        {} as FixedSizeDecoder<string, 4>,
        {} as FixedSizeDecoder<string, 4>,
    ) satisfies FixedSizeDecoder<string, 4>;

    // It returns an Decoder if some input Decoders are VariableSizeDecoder
    getPredicateDecoder(
        predicate,
        {} as VariableSizeDecoder<number>,
        {} as VariableSizeDecoder<number>,
    ) satisfies Decoder<number>;

    getPredicateDecoder(
        predicate,
        {} as FixedSizeDecoder<number>,
        {} as VariableSizeDecoder<number>,
    ) satisfies Decoder<number>;

    getPredicateDecoder(
        predicate,
        {} as VariableSizeDecoder<number>,
        {} as FixedSizeDecoder<number>,
    ) satisfies Decoder<number>;

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

    // It returns a FixedSizeCodec if both codecs are FixedSizeCodec
    getPredicateCodec(
        predicate,
        predicate,
        {} as FixedSizeCodec<number>,
        {} as FixedSizeCodec<number>,
    ) satisfies FixedSizeCodec<number>;

    // It maintains the size if both codecs are FixedSizeCodec with the same size
    getPredicateCodec(
        predicate,
        predicate,
        {} as FixedSizeCodec<string, string, 4>,
        {} as FixedSizeCodec<string, string, 4>,
    ) satisfies FixedSizeCodec<string, string, 4>;

    // It returns a Codec if some input codecs are VariableSizeCodec
    getPredicateCodec(
        predicate,
        predicate,
        {} as VariableSizeCodec<number>,
        {} as VariableSizeCodec<number>,
    ) satisfies Codec<number>;

    getPredicateCodec(
        predicate,
        predicate,
        {} as FixedSizeCodec<number>,
        {} as VariableSizeCodec<number>,
    ) satisfies Codec<number>;

    getPredicateCodec(
        predicate,
        predicate,
        {} as VariableSizeCodec<number>,
        {} as FixedSizeCodec<number>,
    ) satisfies Codec<number>;

    // It does not allow different codec types
    {
        // @ts-expect-error Different codec types
        getPredicateCodec(predicate, predicate, {} as Codec<number>, {} as Codec<string>);
    }
}
