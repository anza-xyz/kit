import { Address, getAddressDecoder } from '@solana/addresses';
import { offsetDecoder, ReadonlyUint8Array, transformDecoder } from '@solana/codecs-core';
import {
    getArrayDecoder,
    getBytesDecoder,
    getHiddenPrefixDecoder,
    getHiddenPrefixEncoder,
    getStructDecoder,
    getStructEncoder,
} from '@solana/codecs-data-structures';
import { getU8Decoder } from '@solana/codecs-numbers';
import { SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO, SolanaError } from '@solana/errors';

import { getOffchainMessageSigningDomainDecoder, getOffchainMessageSigningDomainEncoder } from './signing-domain';
import { getOffchainMessageVersionDecoder, getOffchainMessageVersionEncoder } from './version';

type TDecoderFields = Parameters<typeof getStructDecoder>[0];
type TEncoderFields = Parameters<typeof getStructEncoder>[0];

export function createOffchainMessagePreambleDecoder<const T extends TDecoderFields>(...fields: T) {
    return getHiddenPrefixDecoder(getStructDecoder([['version', getOffchainMessageVersionDecoder()], ...fields]), [
        getOffchainMessageSigningDomainDecoder(),
    ]);
}

export function createOffchainMessagePreambleEncoder<const T extends TEncoderFields>(...fields: T) {
    return getHiddenPrefixEncoder(getStructEncoder([['version', getOffchainMessageVersionEncoder()], ...fields]), [
        getOffchainMessageSigningDomainEncoder(),
    ]);
}

export function decodeRequiredSignatoryAddresses(bytes: ReadonlyUint8Array): readonly Address[] {
    const { version, bytesAfterVersion } = createOffchainMessagePreambleDecoder([
        'bytesAfterVersion',
        getBytesDecoder(),
    ]).decode(bytes);
    return offsetDecoder(
        transformDecoder(getArrayDecoder(getAddressDecoder(), { size: getU8Decoder() }), signatoryAddresses => {
            if (signatoryAddresses.length === 0) {
                throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO);
            }
            return signatoryAddresses;
        }),
        {
            preOffset: ({ preOffset }) =>
                preOffset +
                (version === 0
                    ? 32 + 1 // skip the application domain and message format of v0 messages
                    : 0),
        },
    ).decode(bytesAfterVersion);
}
