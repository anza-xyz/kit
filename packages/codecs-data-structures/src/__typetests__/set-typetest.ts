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

import { getSetCodec, getSetDecoder, getSetEncoder } from '../set';

const sentinel = { __kind: 'sentinel', sentinel: new Uint8Array([0]) } as const;

{
    // [getSetEncoder]: It knows if the encoder is fixed size or variable size.
    getSetEncoder({} as FixedSizeEncoder<string>) satisfies VariableSizeEncoder<Set<string>>;
    getSetEncoder({} as FixedSizeEncoder<string>, { size: 42 }) satisfies FixedSizeEncoder<Set<string>>;
    getSetEncoder({} as Encoder<string>, { size: 0 }) satisfies FixedSizeEncoder<Set<string>, 0>;
    getSetEncoder({} as FixedSizeEncoder<string>, { size: 'remainder' }) satisfies VariableSizeEncoder<Set<string>>;
    getSetEncoder({} as VariableSizeEncoder<string>, { size: 'remainder' }) satisfies VariableSizeEncoder<Set<string>>;
    // A sentinel size is always variable, regardless of the item size.
    getSetEncoder({} as FixedSizeEncoder<string>, { size: sentinel }) satisfies VariableSizeEncoder<Set<string>>;
    getSetEncoder({} as VariableSizeEncoder<string>, { size: sentinel }) satisfies VariableSizeEncoder<Set<string>>;
}

{
    // [getSetDecoder]: It knows if the decoder is fixed size or variable size.
    getSetDecoder({} as FixedSizeDecoder<string>) satisfies VariableSizeDecoder<Set<string>>;
    getSetDecoder({} as FixedSizeDecoder<string>, { size: 42 }) satisfies FixedSizeDecoder<Set<string>>;
    getSetDecoder({} as Decoder<string>, { size: 0 }) satisfies FixedSizeDecoder<Set<string>, 0>;
    getSetDecoder({} as FixedSizeDecoder<string>, { size: 'remainder' }) satisfies VariableSizeDecoder<Set<string>>;
    getSetDecoder({} as VariableSizeDecoder<string>, { size: 'remainder' }) satisfies VariableSizeDecoder<Set<string>>;
    // A sentinel size is always variable, regardless of the item size.
    getSetDecoder({} as FixedSizeDecoder<string>, { size: sentinel }) satisfies VariableSizeDecoder<Set<string>>;
    getSetDecoder({} as VariableSizeDecoder<string>, { size: sentinel }) satisfies VariableSizeDecoder<Set<string>>;
}

{
    // [getSetCodec]: It knows if the codec is fixed size or variable size.
    getSetCodec({} as FixedSizeCodec<string>) satisfies VariableSizeCodec<Set<string>>;
    getSetCodec({} as FixedSizeCodec<string>, { size: 42 }) satisfies FixedSizeCodec<Set<string>>;
    getSetCodec({} as Codec<string>, { size: 0 }) satisfies FixedSizeCodec<Set<string>, Set<string>, 0>;
    getSetCodec({} as FixedSizeCodec<string>, { size: 'remainder' }) satisfies VariableSizeCodec<Set<string>>;
    getSetCodec({} as VariableSizeCodec<string>, { size: 'remainder' }) satisfies VariableSizeCodec<Set<string>>;
    // A sentinel size is always variable, regardless of the item size.
    getSetCodec({} as FixedSizeCodec<string>, { size: sentinel }) satisfies VariableSizeCodec<Set<string>>;
    getSetCodec({} as VariableSizeCodec<string>, { size: sentinel }) satisfies VariableSizeCodec<Set<string>>;
}
