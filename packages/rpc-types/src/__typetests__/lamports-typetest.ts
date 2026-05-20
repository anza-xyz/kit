import {
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import {
    getDefaultLamportsCodec,
    getDefaultLamportsDecoder,
    getDefaultLamportsEncoder,
    getLamportsCodec,
    getLamportsDecoder,
    getLamportsEncoder,
    Lamports,
} from '../lamports';
import { Sol } from '../sol';

// Default encoder
{
    const encoder = getDefaultLamportsEncoder();
    encoder satisfies FixedSizeEncoder<Lamports | Sol, 8>;
    encoder.fixedSize satisfies 8;
    encoder.encode(1n as Lamports) satisfies ReadonlyUint8Array;
    encoder.encode({} as Sol) satisfies ReadonlyUint8Array;
}

// Fixed size inner encoder
{
    const innerEncoder = {} as FixedSizeEncoder<bigint | number, 42>;
    const encoder = getLamportsEncoder(innerEncoder);
    encoder satisfies FixedSizeEncoder<Lamports | Sol, 42>;
    encoder.fixedSize satisfies 42;
    encoder.encode(1n as Lamports) satisfies ReadonlyUint8Array;
    encoder.encode({} as Sol) satisfies ReadonlyUint8Array;
}

// Variable size inner encoder
{
    const innerEncoder = {} as VariableSizeEncoder<bigint | number>;
    const encoder = getLamportsEncoder(innerEncoder);
    // Note: `getSizeFromValue` retains the inner encoder's signature via `ExtractAdditionalProps`
    // so we assert against the narrower `VariableSizeEncoder<Lamports>` rather than the widened
    // `VariableSizeEncoder<Lamports | Sol>` here.
    encoder satisfies VariableSizeEncoder<Lamports>;
    encoder.getSizeFromValue satisfies (value: bigint | number) => number;
    encoder.maxSize satisfies number | undefined;
    encoder.encode(1n as Lamports) satisfies ReadonlyUint8Array;
    encoder.encode({} as Sol) satisfies ReadonlyUint8Array;
}

// Default decoder
{
    const decoder = getDefaultLamportsDecoder();
    decoder satisfies FixedSizeDecoder<Lamports, 8>;
    decoder.fixedSize satisfies 8;
    decoder.decode(null as unknown as ReadonlyUint8Array) satisfies Lamports;
}

// Fixed size inner decoder
{
    const innerDecoder = {} as FixedSizeDecoder<bigint, 42> | FixedSizeDecoder<number, 42>;
    const decoder = getLamportsDecoder(innerDecoder);
    decoder satisfies FixedSizeDecoder<Lamports, 42>;
    decoder.fixedSize satisfies 42;
    decoder.decode(null as unknown as ReadonlyUint8Array) satisfies Lamports;
}

// Variable size inner decoder
{
    const innerDecoder = {} as VariableSizeDecoder<bigint> | VariableSizeDecoder<number>;
    const decoder = getLamportsDecoder(innerDecoder);
    decoder satisfies VariableSizeDecoder<Lamports>;
    decoder.maxSize satisfies number | undefined;
    decoder.decode(null as unknown as ReadonlyUint8Array) satisfies Lamports;
}

// Default codec
{
    const codec = getDefaultLamportsCodec();
    codec satisfies FixedSizeCodec<Lamports | Sol, Lamports, 8>;
    codec satisfies FixedSizeEncoder<Lamports | Sol, 8>;
    codec satisfies FixedSizeDecoder<Lamports, 8>;
    codec.fixedSize satisfies 8;
    codec.encode(1n as Lamports) satisfies ReadonlyUint8Array;
    codec.encode({} as Sol) satisfies ReadonlyUint8Array;
    codec.decode(null as unknown as ReadonlyUint8Array) satisfies Lamports;
}

// Fixed size inner codec
{
    const innerCodec = {} as FixedSizeCodec<bigint | number, bigint, 42> | FixedSizeCodec<bigint | number, number, 42>;
    const codec = getLamportsCodec(innerCodec);
    codec satisfies FixedSizeCodec<Lamports | Sol, Lamports, 42>;
    codec satisfies FixedSizeEncoder<Lamports | Sol, 42>;
    codec satisfies FixedSizeDecoder<Lamports, 42>;
    codec.fixedSize satisfies 42;
    codec.encode(1n as Lamports) satisfies ReadonlyUint8Array;
    codec.encode({} as Sol) satisfies ReadonlyUint8Array;
    codec.decode(null as unknown as ReadonlyUint8Array) satisfies Lamports;
}

// Variable size codec
{
    const innerCodec = {} as VariableSizeCodec<bigint | number, bigint> | VariableSizeCodec<bigint | number, number>;
    const codec = getLamportsCodec(innerCodec);
    // Note: `getSizeFromValue` retains the inner codec's signature via `ExtractAdditionalProps`
    // so we assert against the narrower `VariableSizeCodec<Lamports, Lamports>` here.
    codec satisfies VariableSizeCodec<Lamports, Lamports>;
    codec.maxSize satisfies number | undefined;
    codec.encode(1n as Lamports) satisfies ReadonlyUint8Array;
    codec.encode({} as Sol) satisfies ReadonlyUint8Array;
    codec.decode(null as unknown as ReadonlyUint8Array) satisfies Lamports;
}
