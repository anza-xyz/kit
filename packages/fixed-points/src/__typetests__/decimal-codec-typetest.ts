import type { FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';

import {
    type DecimalFixedPoint,
    getDecimalFixedPointCodec,
    getDecimalFixedPointDecoder,
    getDecimalFixedPointEncoder,
} from '../decimal';

// [DESCRIBE] getDecimalFixedPointEncoder.
{
    // It preserves the shape generics in the encoded payload type.
    {
        const encoder = getDecimalFixedPointEncoder('unsigned', 64, 6);
        encoder satisfies FixedSizeEncoder<DecimalFixedPoint<'unsigned', 64, 6>, 8>;
    }

    // It preserves the byte-size literal for all supported byte-aligned widths.
    {
        getDecimalFixedPointEncoder('unsigned', 8, 0) satisfies FixedSizeEncoder<
            DecimalFixedPoint<'unsigned', 8, 0>,
            1
        >;
        getDecimalFixedPointEncoder('signed', 32, 6) satisfies FixedSizeEncoder<DecimalFixedPoint<'signed', 32, 6>, 4>;
        getDecimalFixedPointEncoder('unsigned', 128, 18) satisfies FixedSizeEncoder<
            DecimalFixedPoint<'unsigned', 128, 18>,
            16
        >;
    }
}

// [DESCRIBE] getDecimalFixedPointDecoder.
{
    // It preserves the shape generics in the decoded payload type.
    {
        const decoder = getDecimalFixedPointDecoder('unsigned', 64, 6);
        decoder satisfies FixedSizeDecoder<DecimalFixedPoint<'unsigned', 64, 6>, 8>;
    }
}

// [DESCRIBE] getDecimalFixedPointCodec.
{
    // It preserves the shape generics in both the encoded and decoded payload types.
    {
        const codec = getDecimalFixedPointCodec('unsigned', 128, 18);
        codec satisfies FixedSizeCodec<
            DecimalFixedPoint<'unsigned', 128, 18>,
            DecimalFixedPoint<'unsigned', 128, 18>,
            16
        >;
    }
}
