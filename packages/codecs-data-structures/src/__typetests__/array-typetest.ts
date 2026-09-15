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

import { getArrayCodec, getArrayDecoder, getArrayEncoder } from '../array';

const sentinel = { __kind: 'sentinel', sentinel: new Uint8Array([0]) } as const;

{
    // [getArrayEncoder]: It knows if the encoder is fixed size or variable size.
    getArrayEncoder({} as FixedSizeEncoder<string>) satisfies VariableSizeEncoder<string[]>;
    getArrayEncoder({} as FixedSizeEncoder<string>, { size: 42 }) satisfies FixedSizeEncoder<string[]>;
    getArrayEncoder({} as Encoder<string>, { size: 0 }) satisfies FixedSizeEncoder<string[], 0>;
    getArrayEncoder({} as FixedSizeEncoder<string>, { size: 'remainder' }) satisfies VariableSizeEncoder<string[]>;
    getArrayEncoder({} as VariableSizeEncoder<string>, { size: 'remainder' }) satisfies VariableSizeEncoder<string[]>;
    // A sentinel size is always variable, regardless of the item size.
    getArrayEncoder({} as FixedSizeEncoder<string>, { size: sentinel }) satisfies VariableSizeEncoder<string[]>;
    getArrayEncoder({} as VariableSizeEncoder<string>, { size: sentinel }) satisfies VariableSizeEncoder<string[]>;
}

{
    // [getArrayDecoder]: It knows if the decoder is fixed size or variable size.
    getArrayDecoder({} as FixedSizeDecoder<string>) satisfies VariableSizeDecoder<string[]>;
    getArrayDecoder({} as FixedSizeDecoder<string>, { size: 42 }) satisfies FixedSizeDecoder<string[]>;
    getArrayDecoder({} as Decoder<string>, { size: 0 }) satisfies FixedSizeDecoder<string[], 0>;
    getArrayDecoder({} as FixedSizeDecoder<string>, { size: 'remainder' }) satisfies VariableSizeDecoder<string[]>;
    getArrayDecoder({} as VariableSizeDecoder<string>, { size: 'remainder' }) satisfies VariableSizeDecoder<string[]>;
    // A sentinel size is always variable, regardless of the item size.
    getArrayDecoder({} as FixedSizeDecoder<string>, { size: sentinel }) satisfies VariableSizeDecoder<string[]>;
    getArrayDecoder({} as VariableSizeDecoder<string>, { size: sentinel }) satisfies VariableSizeDecoder<string[]>;
}

{
    // [getArrayCodec]: It knows if the codec is fixed size or variable size.
    getArrayCodec({} as FixedSizeCodec<string>) satisfies VariableSizeCodec<string[]>;
    getArrayCodec({} as FixedSizeCodec<string>, { size: 42 }) satisfies FixedSizeCodec<string[]>;
    getArrayCodec({} as Codec<string>, { size: 0 }) satisfies FixedSizeCodec<string[], string[], 0>;
    getArrayCodec({} as FixedSizeCodec<string>, { size: 'remainder' }) satisfies VariableSizeCodec<string[]>;
    getArrayCodec({} as VariableSizeCodec<string>, { size: 'remainder' }) satisfies VariableSizeCodec<string[]>;
    // A sentinel size is always variable, regardless of the item size.
    getArrayCodec({} as FixedSizeCodec<string>, { size: sentinel }) satisfies VariableSizeCodec<string[]>;
    getArrayCodec({} as VariableSizeCodec<string>, { size: sentinel }) satisfies VariableSizeCodec<string[]>;
}

{
    // [getArrayCodec]: It allows passing a description in the config.
    getArrayCodec({} as FixedSizeCodec<string>, { description: 'myDescription', size: 42 }) satisfies FixedSizeCodec<
        string[]
    >;
}
