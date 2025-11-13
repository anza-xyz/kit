import { Address, getAddressDecoder } from '@solana/addresses';
import {
    FixedSizeDecoder,
    FixedSizeEncoder,
    offsetDecoder,
    ReadonlyUint8Array,
    transformDecoder,
    transformEncoder,
} from '@solana/codecs-core';
import {
    getArrayDecoder,
    getBytesDecoder,
    getHiddenPrefixDecoder,
    getHiddenPrefixEncoder,
    getStructDecoder,
    getStructEncoder,
} from '@solana/codecs-data-structures';
import { getU8Decoder, getU8Encoder } from '@solana/codecs-numbers';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED,
    SolanaError,
} from '@solana/errors';

import { OffchainMessageVersion } from '../version';
import { getOffchainMessageSigningDomainDecoder, getOffchainMessageSigningDomainEncoder } from './signing-domain';

type TDecoderFields = Parameters<typeof getStructDecoder>[0];
type TEncoderFields = Parameters<typeof getStructEncoder>[0];

function getSigningDomainPrefixedDecoder<const T extends TDecoderFields>(...fields: T) {
    return getHiddenPrefixDecoder(getStructDecoder(fields), [getOffchainMessageSigningDomainDecoder()]);
}

function getSigningDomainPrefixedEncoder<const T extends TEncoderFields>(...fields: T) {
    return getHiddenPrefixEncoder(getStructEncoder(fields), [getOffchainMessageSigningDomainEncoder()]);
}

function getVersionTransformer(fixedVersion?: OffchainMessageVersion) {
    return (version: number) => {
        if (version !== 0) {
            throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: version,
            });
        }
        if (fixedVersion != null && version !== fixedVersion) {
            throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__UNEXPECTED_VERSION, {
                actualVersion: version,
                expectedVersion: fixedVersion,
            });
        }
        return version;
    };
}

export function createOffchainMessagePreambleDecoder<const T extends TDecoderFields>(
    version: OffchainMessageVersion,
    ...fields: T
) {
    return getSigningDomainPrefixedDecoder(
        [
            'version',
            transformDecoder(getU8Decoder(), getVersionTransformer(version)) as FixedSizeDecoder<typeof version, 1>,
        ],
        ...fields,
    );
}

export function createOffchainMessagePreambleEncoder<const T extends TEncoderFields>(
    version: OffchainMessageVersion,
    ...fields: T
) {
    return getSigningDomainPrefixedEncoder(
        [
            'version',
            transformEncoder(getU8Encoder(), getVersionTransformer(version)) as FixedSizeEncoder<typeof version, 1>,
        ],
        ...fields,
    );
}

export function decodeRequiredSignatoryAddresses(bytes: ReadonlyUint8Array): readonly Address[] {
    const { version, bytesAfterVersion } = getSigningDomainPrefixedDecoder(
        ['version', transformDecoder(getU8Decoder(), getVersionTransformer())],
        ['bytesAfterVersion', getBytesDecoder()],
    ).decode(bytes);
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
