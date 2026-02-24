import {
    fixDecoderSize,
    FixedSizeDecoder,
    FixedSizeEncoder,
    fixEncoderSize,
    transformEncoder,
} from '@solana/codecs-core';
import { getNullableEncoder } from '@solana/codecs-data-structures';
import { getBase58Decoder, getBase58Encoder } from '@solana/codecs-strings';

import { getCompiledLifetimeToken } from '../../compile/legacy/lifetime-token';

type LifetimeToken = ReturnType<typeof getCompiledLifetimeToken>;

export function getLifetimeTokenEncoder(): FixedSizeEncoder<LifetimeToken | undefined> {
    return transformEncoder(
        getNullableEncoder(fixEncoderSize(getBase58Encoder(), 32), {
            noneValue: 'zeroes',
            prefix: null,
        }),
        token => token ?? null,
    );
}

export function getLifetimeTokenDecoder(): FixedSizeDecoder<LifetimeToken> {
    return fixDecoderSize(getBase58Decoder(), 32);
}
