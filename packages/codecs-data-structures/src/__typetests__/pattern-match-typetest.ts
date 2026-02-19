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

// [DESCRIBE] getPatternMatchEncoder
{
    // It returns an encoder for the same type as the inputs
    getPatternMatchEncoder([[numberValuePredicate, {} as Encoder<number>]]) satisfies Encoder<number>;

    // It returns a FixedSizeEncoder if all encoders are FixedSizeEncoder
    getPatternMatchEncoder([
        [numberValuePredicate, {} as FixedSizeEncoder<number>],
        [numberValuePredicate, {} as FixedSizeEncoder<number>],
    ]) satisfies FixedSizeEncoder<number>;

    // It maintains the size if all encoders are FixedSizeEncoder with the same size
    getPatternMatchEncoder([
        [stringValuePredicate, {} as FixedSizeEncoder<string, 4>],
        [stringValuePredicate, {} as FixedSizeEncoder<string, 4>],
    ]) satisfies FixedSizeEncoder<string, 4>;

    // It returns a VariableSizeEncoder if all encoders are VariableSizeEncoder
    getPatternMatchEncoder([
        [numberValuePredicate, {} as VariableSizeEncoder<number>],
        [numberValuePredicate, {} as VariableSizeEncoder<number>],
    ]) satisfies VariableSizeEncoder<number>;

    // It returns an Encoder if some input encoders are VariableSizeEncoder
    getPatternMatchEncoder([
        [numberValuePredicate, {} as VariableSizeEncoder<number>],
        [numberValuePredicate, {} as VariableSizeEncoder<number>],
    ]) satisfies Encoder<number>;

    getPatternMatchEncoder([
        [numberValuePredicate, {} as FixedSizeEncoder<number>],
        [numberValuePredicate, {} as VariableSizeEncoder<number>],
    ]) satisfies Encoder<number>;

    getPatternMatchEncoder([
        [numberValuePredicate, {} as VariableSizeEncoder<number>],
        [numberValuePredicate, {} as FixedSizeEncoder<number>],
    ]) satisfies Encoder<number>;
}

// [DESCRIBE] getPatternMatchDecoder
{
    // It returns a decoder for the same type as the inputs
    getPatternMatchDecoder([[bytesPredicate, {} as Decoder<number>]]) satisfies Decoder<number>;

    // It returns a FixedSizeDecoder if all decoders are FixedSizeDecoder
    getPatternMatchDecoder([
        [bytesPredicate, {} as FixedSizeDecoder<number>],
        [bytesPredicate, {} as FixedSizeDecoder<number>],
    ]) satisfies FixedSizeDecoder<number>;

    // It maintains the size if all decoders are FixedSizeDecoder with the same size
    getPatternMatchDecoder([
        [bytesPredicate, {} as FixedSizeDecoder<string, 4>],
        [bytesPredicate, {} as FixedSizeDecoder<string, 4>],
    ]) satisfies FixedSizeDecoder<string, 4>;

    // It returns a VariableSizeDecoder if all decoders are VariableSizeDecoder
    getPatternMatchDecoder([
        [bytesPredicate, {} as VariableSizeDecoder<number>],
        [bytesPredicate, {} as VariableSizeDecoder<number>],
    ]) satisfies VariableSizeDecoder<number>;

    // It returns a Decoder if some input decoders are VariableSizeDecoder
    getPatternMatchDecoder([
        [bytesPredicate, {} as VariableSizeDecoder<number>],
        [bytesPredicate, {} as VariableSizeDecoder<number>],
    ]) satisfies Decoder<number>;

    getPatternMatchDecoder([
        [bytesPredicate, {} as FixedSizeDecoder<number>],
        [bytesPredicate, {} as VariableSizeDecoder<number>],
    ]) satisfies Decoder<number>;

    getPatternMatchDecoder([
        [bytesPredicate, {} as VariableSizeDecoder<number>],
        [bytesPredicate, {} as FixedSizeDecoder<number>],
    ]) satisfies Decoder<number>;
}

// [DESCRIBE] getPatternMatchCodec
{
    // It returns a codec for the same type as the inputs
    getPatternMatchCodec([[numberValuePredicate, bytesPredicate, {} as Codec<number>]]) satisfies Codec<number>;

    // It returns a FixedSizeCodec if all codecs are FixedSizeCodec
    getPatternMatchCodec([
        [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
        [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
    ]) satisfies FixedSizeCodec<number>;

    // It maintains the size if all codecs are FixedSizeCodec with the same size
    getPatternMatchCodec([
        [stringValuePredicate, bytesPredicate, {} as FixedSizeCodec<string, string, 4>],
        [stringValuePredicate, bytesPredicate, {} as FixedSizeCodec<string, string, 4>],
    ]) satisfies FixedSizeCodec<string, string, 4>;

    // It returns a VariableSizeCodec if all codecs are VariableSizeCodec
    getPatternMatchCodec([
        [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
        [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
    ]) satisfies VariableSizeCodec<number>;

    // It returns a Codec if some input codecs are VariableSizeCodec
    getPatternMatchCodec([
        [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
        [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
    ]) satisfies Codec<number>;

    getPatternMatchCodec([
        [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
        [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
    ]) satisfies Codec<number>;

    getPatternMatchCodec([
        [numberValuePredicate, bytesPredicate, {} as VariableSizeCodec<number>],
        [numberValuePredicate, bytesPredicate, {} as FixedSizeCodec<number>],
    ]) satisfies Codec<number>;
}
