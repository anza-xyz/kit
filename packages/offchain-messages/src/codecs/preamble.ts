import { getAddressDecoder, getAddressEncoder } from '@solana/addresses';
import {
    combineCodec,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import {
    getArrayDecoder,
    getArrayEncoder,
    getHiddenPrefixDecoder,
    getHiddenPrefixEncoder,
    getStructDecoder,
    getStructEncoder,
} from '@solana/codecs-data-structures';
import { getU8Decoder, getU8Encoder, getU16Decoder, getU16Encoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO, SolanaError } from '@solana/errors';

import { OffchainMessagePreamble } from '../preamble';
import {
    getOffchainMessageApplicationDomainDecoder,
    getOffchainMessageApplicationDomainEncoder,
} from './application-domain';
import { getOffchainMessageContentFormatDecoder, getOffchainMessageContentFormatEncoder } from './content';
import { getOffchainMessageSigningDomainDecoder, getOffchainMessageSigningDomainEncoder } from './signing-domain';
import { getOffchainMessageVersionDecoder, getOffchainMessageVersionEncoder } from './version';

export function getOffchainMessagePreambleDecoder(): VariableSizeDecoder<OffchainMessagePreamble> {
    return getHiddenPrefixDecoder(
        getStructDecoder([
            ['version', getOffchainMessageVersionDecoder()],
            ['applicationDomain', getOffchainMessageApplicationDomainDecoder()],
            ['messageFormat', getOffchainMessageContentFormatDecoder()],
            [
                'requiredSigners',
                transformDecoder(getArrayDecoder(getAddressDecoder(), { size: getU8Decoder() }), signerAddresses => {
                    if (signerAddresses.length === 0) {
                        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO);
                    }
                    return signerAddresses.map(address => Object.freeze({ address }));
                }),
            ],
            ['messageLength', getU16Decoder()],
        ]),
        [getOffchainMessageSigningDomainDecoder()],
    );
}

export function getOffchainMessagePreambleEncoder(): VariableSizeEncoder<OffchainMessagePreamble> {
    return getHiddenPrefixEncoder(
        getStructEncoder([
            ['version', getOffchainMessageVersionEncoder()],
            ['applicationDomain', getOffchainMessageApplicationDomainEncoder()],
            ['messageFormat', getOffchainMessageContentFormatEncoder()],
            [
                'requiredSigners',
                transformEncoder(
                    getArrayEncoder(getAddressEncoder(), { size: getU8Encoder() }),
                    (signerAddresses: OffchainMessagePreamble['requiredSigners']) => {
                        if (signerAddresses.length === 0) {
                            throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO);
                        }
                        return signerAddresses.map(({ address }) => address);
                    },
                ),
            ],
            ['messageLength', getU16Encoder()],
        ]),
        [getOffchainMessageSigningDomainEncoder()],
    );
}

export function getOffchainMessagePreambleCodec(): VariableSizeCodec<OffchainMessagePreamble> {
    return combineCodec(getOffchainMessagePreambleEncoder(), getOffchainMessagePreambleDecoder());
}
