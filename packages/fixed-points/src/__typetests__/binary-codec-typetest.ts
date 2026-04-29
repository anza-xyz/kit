import type { FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import {
    type BinaryFixedPoint,
    getBinaryFixedPointCodec,
    getBinaryFixedPointDecoder,
    getBinaryFixedPointEncoder,
} from '../binary';

// [DESCRIBE] getBinaryFixedPointEncoder.
{
    // It preserves the shape generics in the encoded payload type.
    {
        const encoder = getBinaryFixedPointEncoder('signed', 16, 15);
        encoder satisfies FixedSizeEncoder<BinaryFixedPoint<'signed', 16, 15>, 2>;
    }

    // It preserves the byte-size literal for all supported byte-aligned widths.
    {
        getBinaryFixedPointEncoder('unsigned', 8, 0) satisfies FixedSizeEncoder<BinaryFixedPoint<'unsigned', 8, 0>, 1>;
        getBinaryFixedPointEncoder('signed', 32, 16) satisfies FixedSizeEncoder<BinaryFixedPoint<'signed', 32, 16>, 4>;
        getBinaryFixedPointEncoder('unsigned', 128, 64) satisfies FixedSizeEncoder<
            BinaryFixedPoint<'unsigned', 128, 64>,
            16
        >;
    }
}

// [DESCRIBE] getBinaryFixedPointDecoder.
{
    // It preserves the shape generics in the decoded payload type.
    {
        const decoder = getBinaryFixedPointDecoder('signed', 16, 15);
        decoder satisfies FixedSizeDecoder<BinaryFixedPoint<'signed', 16, 15>, 2>;
    }
}

// [DESCRIBE] getBinaryFixedPointCodec.
{
    // It preserves the shape generics in both the encoded and decoded payload types.
    {
        const codec = getBinaryFixedPointCodec('unsigned', 128, 64);
        codec satisfies FixedSizeCodec<
            BinaryFixedPoint<'unsigned', 128, 64>,
            BinaryFixedPoint<'unsigned', 128, 64>,
            16
        >;
    }
}
