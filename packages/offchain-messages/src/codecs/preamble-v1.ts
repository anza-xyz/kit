import { getAddressDecoder, getAddressEncoder } from '@solana/addresses';
import {
    combineCodec,
    fixDecoderSize,
    ReadonlyUint8Array,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getArrayDecoder, getArrayEncoder, getBytesDecoder, getBytesEncoder } from '@solana/codecs-data-structures';
import { getU8Decoder, getU8Encoder } from '@solana/codecs-numbers';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_SORTED,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE,
    SolanaError,
} from '@solana/errors';

import { OffchainMessagePreambleV1 } from '../preamble-v1';
import {
    createOffchainMessagePreambleDecoder,
    createOffchainMessagePreambleEncoder,
    getSignatoriesComparator,
} from './preamble-common';

export function getOffchainMessageV1PreambleDecoder(): VariableSizeDecoder<OffchainMessagePreambleV1> {
    return createOffchainMessagePreambleDecoder(/* version */ 1, [
        'requiredSignatories',
        transformDecoder(
            getArrayDecoder(fixDecoderSize(getBytesDecoder(), 32), { size: getU8Decoder() }),
            signatoryAddressesBytes => {
                if (signatoryAddressesBytes.length === 0) {
                    throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO);
                }
                const comparator = getSignatoriesComparator();
                for (let ii = 0; ii < signatoryAddressesBytes.length - 1; ii++) {
                    switch (comparator(signatoryAddressesBytes[ii], signatoryAddressesBytes[ii + 1])) {
                        case 0:
                            throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE);
                        case 1:
                            throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_SORTED);
                    }
                }
                const addressDecoder = getAddressDecoder();
                return signatoryAddressesBytes.map(addressBytes =>
                    Object.freeze({
                        address: addressDecoder.decode(addressBytes),
                    }),
                );
            },
        ),
    ]);
}

export function getOffchainMessageV1PreambleEncoder(): VariableSizeEncoder<OffchainMessagePreambleV1> {
    return createOffchainMessagePreambleEncoder(/* version */ 1, [
        'requiredSignatories',
        transformEncoder(
            transformEncoder(
                getArrayEncoder(getBytesEncoder(), { size: getU8Encoder() }),
                (signatoryAddressesBytes: readonly ReadonlyUint8Array[]) => {
                    return signatoryAddressesBytes.toSorted(getSignatoriesComparator());
                },
            ),
            (signatoryAddresses: OffchainMessagePreambleV1['requiredSignatories']) => {
                if (signatoryAddresses.length === 0) {
                    throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO);
                }
                const seenSignatories = new Set();
                for (const { address } of signatoryAddresses) {
                    if (seenSignatories.has(address)) {
                        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__SIGNATORIES_MUST_BE_UNIQUE);
                    }
                    seenSignatories.add(address);
                }
                const addressEncoder = getAddressEncoder();
                return signatoryAddresses.map(({ address }) => addressEncoder.encode(address));
            },
        ),
    ]);
}

export function getOffchainMessageV1PreambleCodec(): VariableSizeCodec<OffchainMessagePreambleV1> {
    return combineCodec(getOffchainMessageV1PreambleEncoder(), getOffchainMessageV1PreambleDecoder());
}
