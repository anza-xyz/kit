import { combineCodec, FixedSizeCodec, FixedSizeDecoder, FixedSizeEncoder } from '@solana/codecs-core';
import { getEnumDecoder, getEnumEncoder } from '@solana/codecs-data-structures';

import { OffchainMessageContentFormat } from '../content';

export function getOffchainMessageContentFormatDecoder(): FixedSizeDecoder<OffchainMessageContentFormat, 1> {
    return getEnumDecoder(OffchainMessageContentFormat, {
        useValuesAsDiscriminators: true,
    });
}

export function getOffchainMessageContentFormatEncoder(): FixedSizeEncoder<OffchainMessageContentFormat, 1> {
    return getEnumEncoder(OffchainMessageContentFormat, {
        useValuesAsDiscriminators: true,
    });
}

export function getOffchainMessageContentFormatCodec(): FixedSizeCodec<
    OffchainMessageContentFormat,
    OffchainMessageContentFormat,
    1
> {
    return combineCodec(getOffchainMessageContentFormatEncoder(), getOffchainMessageContentFormatDecoder());
}
