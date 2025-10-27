import {
    combineCodec,
    createDecoder,
    createEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getHiddenPrefixDecoder } from '@solana/codecs-data-structures';
import { getU8Decoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import { OffchainMessage } from '../message';
import { getOffchainMessageV0Decoder, getOffchainMessageV0Encoder } from './message-v0';
import { getOffchainMessageSigningDomainDecoder } from './signing-domain';

export function getOffchainMessageDecoder(): VariableSizeDecoder<OffchainMessage> {
    return createDecoder({
        read(bytes, offset) {
            const version = getHiddenPrefixDecoder(getU8Decoder(), [
                // Discard the signing domain
                getOffchainMessageSigningDomainDecoder(),
            ]).decode(bytes, offset);
            switch (version) {
                case 0:
                    return getOffchainMessageV0Decoder().read(bytes, offset);
                default:
                    throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                        unsupportedVersion: version,
                    });
            }
        },
    });
}

export function getOffchainMessageEncoder(): VariableSizeEncoder<OffchainMessage> {
    return createEncoder({
        getSizeFromValue: offchainMessage => {
            switch (offchainMessage.version) {
                case 0:
                    return getOffchainMessageV0Encoder().getSizeFromValue(offchainMessage);
                default:
                    throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                        unsupportedVersion: offchainMessage.version satisfies never,
                    });
            }
        },
        write: (offchainMessage, bytes, offset) => {
            switch (offchainMessage.version) {
                case 0:
                    return getOffchainMessageV0Encoder().write(offchainMessage, bytes, offset);
                default:
                    throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                        unsupportedVersion: offchainMessage.version satisfies never,
                    });
            }
        },
    });
}

export function getOffchainMessageCodec(): VariableSizeCodec<OffchainMessage> {
    return combineCodec(getOffchainMessageEncoder(), getOffchainMessageDecoder());
}
