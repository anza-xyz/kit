import { Address, address } from '@solana/addresses';
import {
    combineCodec,
    fixDecoderSize,
    ReadonlyUint8Array,
    transformDecoder,
    transformEncoder,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import {
    getArrayDecoder,
    getBytesDecoder,
    getBytesEncoder,
    getStructDecoder,
    getStructEncoder,
} from '@solana/codecs-data-structures';
import { getU8Decoder } from '@solana/codecs-numbers';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__ENVELOPE_SIGNERS_MISMATCH,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes } from '@solana/keys';

import { OffchainMessageEnvelope } from '../envelope';
import { OffchainMessageBytes } from '../message';
import { decodeRequiredSignatoryAddresses } from './preamble-common';
import { getSignaturesEncoder } from './signatures';

/**
 * Returns an encoder that you can use to encode an {@link OffchainMessageEnvelope} to a byte array
 * appropriate for sharing with a third party for validation.
 */
export function getOffchainMessageEnvelopeEncoder(): VariableSizeEncoder<OffchainMessageEnvelope> {
    return transformEncoder(
        getStructEncoder([
            ['signatures', getSignaturesEncoder()],
            ['content', getBytesEncoder()],
        ]),
        envelope => {
            const signaturesMapAddresses = Object.keys(envelope.signatures).map(address);
            if (signaturesMapAddresses.length === 0) {
                throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO);
            }
            const signatoryAddresses = decodeAndValidateRequiredSignatoryAddresses(envelope.content);
            const missingRequiredSigners = [];
            const unexpectedSigners = [];
            for (const address of signatoryAddresses) {
                if (!signaturesMapAddresses.includes(address)) {
                    missingRequiredSigners.push(address);
                }
            }
            for (const address of signaturesMapAddresses) {
                if (!signatoryAddresses.includes(address)) {
                    unexpectedSigners.push(address);
                }
            }
            if (missingRequiredSigners.length || unexpectedSigners.length) {
                throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__ENVELOPE_SIGNERS_MISMATCH, {
                    missingRequiredSigners,
                    unexpectedSigners,
                });
            }
            const orderedSignatureMap: OffchainMessageEnvelope['signatures'] = {};
            for (const address of signatoryAddresses) {
                orderedSignatureMap[address] = envelope.signatures[address];
            }
            return {
                ...envelope,
                signatures: orderedSignatureMap,
            };
        },
    );
}

/**
 * Returns a decoder that you can use to convert a byte array in the Solana offchain message format
 * to a {@link OffchainMessageEnvelope} object.
 *
 * @example
 * ```ts
 * import { getOffchainMessageEnvelopeDecoder } from '@solana/offchain-messages';
 *
 * const offchainMessageEnvelopeDecoder = getOffchainMessageEnvelopeDecoder();
 * const offchainMessageEnvelope = offchainMessageEnvelopeDecoder.decode(offchainMessageEnvelopeBytes);
 * for (const [address, signature] in Object.entries(offchainMessageEnvelope.signatures)) {
 *     console.log(`Signature by ${address}`, signature);
 * }
 * ```
 */
export function getOffchainMessageEnvelopeDecoder(): VariableSizeDecoder<OffchainMessageEnvelope> {
    return transformDecoder(
        getStructDecoder([
            ['signatures', getArrayDecoder(fixDecoderSize(getBytesDecoder(), 64), { size: getU8Decoder() })],
            ['content', getBytesDecoder()],
        ]),
        decodePartiallyDecodedOffchainMessageEnvelope,
    );
}

/**
 * Returns a codec that you can use to encode from or decode to an {@link OffchainMessageEnvelope}
 *
 * @see {@link getOffchainMessageEnvelopeDecoder}
 * @see {@link getOffchainMessageEnvelopeEncoder}
 */
export function getOffchainMessageEnvelopeCodec() {
    return combineCodec(getOffchainMessageEnvelopeEncoder(), getOffchainMessageEnvelopeDecoder());
}

type PartiallyDecodedOffchainMessageEnvelope = {
    content: ReadonlyUint8Array;
    signatures: ReadonlyUint8Array[];
};

function decodePartiallyDecodedOffchainMessageEnvelope(
    offchainMessageEnvelope: PartiallyDecodedOffchainMessageEnvelope,
): OffchainMessageEnvelope {
    const { content, signatures } = offchainMessageEnvelope;

    if (signatures.length === 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO);
    }

    const signatoryAddresses = decodeAndValidateRequiredSignatoryAddresses(content);

    // Signer addresses and signatures must be the same length
    // We encode an all-zero signature when the signature is missing
    if (signatoryAddresses.length !== signatures.length) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH, {
            numRequiredSignatures: signatoryAddresses.length,
            signatoryAddresses,
            signaturesLength: signatures.length,
        });
    }

    // Combine the signer addresses + signatures into the signatures map
    const signaturesMap: OffchainMessageEnvelope['signatures'] = {};
    signatoryAddresses.forEach((address, index) => {
        const signatureForAddress = signatures[index];
        if (signatureForAddress.every(b => b === 0)) {
            signaturesMap[address] = null;
        } else {
            signaturesMap[address] = signatureForAddress as SignatureBytes;
        }
    });

    return Object.freeze({
        content: content as OffchainMessageBytes,
        signatures: Object.freeze(signaturesMap),
    });
}

function decodeAndValidateRequiredSignatoryAddresses(bytes: ReadonlyUint8Array): readonly Address[] {
    const signatoryAddresses = decodeRequiredSignatoryAddresses(bytes);

    if (signatoryAddresses.length === 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO);
    }

    return signatoryAddresses;
}
