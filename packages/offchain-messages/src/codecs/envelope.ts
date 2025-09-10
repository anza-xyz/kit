import { getAddressDecoder } from '@solana/addresses';
import {
    combineCodec,
    fixDecoderSize,
    offsetDecoder,
    ReadonlyUint8Array,
    transformDecoder,
    VariableSizeDecoder,
} from '@solana/codecs-core';
import {
    getArrayDecoder,
    getBytesDecoder,
    getBytesEncoder,
    getConstantDecoder,
    getHiddenPrefixDecoder,
    getStructDecoder,
    getStructEncoder,
} from '@solana/codecs-data-structures';
import { getU8Decoder } from '@solana/codecs-numbers';
import {
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO,
    SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH,
    SolanaError,
} from '@solana/errors';
import { SignatureBytes } from '@solana/keys';

import { OffchainMessageEnvelope, OffchainMessageSignaturesMap } from '../envelope';
import { OffchainMessageBytes } from '../message';
import { getSignaturesEncoder } from './signatures';
import { getOffchainMessageSigningDomainDecoder } from './signing-domain';

/**
 * Returns an encoder that you can use to encode an {@link OffchainMessageEnvelope} to a byte array
 * appropriate for sharing with a third party for validation.
 */
export function getOffchainMessageEnvelopeEncoder() {
    return getStructEncoder([
        ['signatures', getSignaturesEncoder()],
        ['content', getBytesEncoder()],
    ]);
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

    const signerAddressesDecoder = getHiddenPrefixDecoder(
        offsetDecoder(getArrayDecoder(getAddressDecoder(), { size: getU8Decoder() }), {
            preOffset({ preOffset }) {
                return (
                    preOffset +
                    // Skip the application domain
                    32 +
                    // Skip the message format
                    1
                );
            },
        }),
        [
            // Discard the signing domain
            getOffchainMessageSigningDomainDecoder(),
            // Version (only version `0` is understood as of this writing)
            getConstantDecoder(new Uint8Array([0])),
        ],
    );
    const signerAddresses = signerAddressesDecoder.decode(content);

    if (signatures.length === 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_ENVELOPE_SIGNATURES_CANNOT_BE_ZERO);
    }

    if (signerAddresses.length === 0) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_REQUIRED_SIGNERS_CANNOT_BE_ZERO);
    }

    // Signer addresses and signatures must be the same length
    // We encode an all-zero signature when the signature is missing
    if (signerAddresses.length !== signatures.length) {
        throw new SolanaError(SOLANA_ERROR__OFFCHAIN_MESSAGE__NUM_SIGNATURES_MISMATCH, {
            numRequiredSignatures: signerAddresses.length,
            signaturesLength: signatures.length,
            signerAddresses,
        });
    }

    // Combine the signer addresses + signatures into the signatures map
    const signaturesMap: OffchainMessageSignaturesMap = {};
    signerAddresses.forEach((address, index) => {
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
