import { Address } from '@solana/addresses';
import { SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE, SolanaError } from '@solana/errors';
import { SignatureBytes } from '@solana/keys';

import { compileOffchainMessageV0Envelope } from './envelope-v0';
import { compileOffchainMessageV1Envelope } from './envelope-v1';
import { OffchainMessage, OffchainMessageBytes } from './message';

type OrderedMap<K extends string, V> = Record<K, V>;
type OffchainMessageSignaturesMap = OrderedMap<Address, SignatureBytes | null>;

export interface OffchainMessageEnvelope {
    /** The bytes of the combined offchain message preamble and content */
    readonly content: OffchainMessageBytes;
    /**
     * A map between the addresses of an offchain message's signers, and the 64-byte Ed25519
     * signature of the combined message preamble and message content by the private key associated
     * with each.
     */
    readonly signatures: OffchainMessageSignaturesMap;
}

/**
 * Returns an {@link OffchainMessageEnvelope} object for a given {@link OffchainMessage}.
 *
 * This includes the compiled bytes of the offchain message, and a map of signatures. This map will
 * have a key for each address that is required to sign the message. The message envelope will not
 * yet have signatures for any of these signatories.
 *
 * @remarks
 * If the offchain message version is known ahead of time, use one of the compile functions
 * specific to that version so as not to bundle more code than you need.
 */
export function compileOffchainMessageEnvelope(offchainMessage: OffchainMessage): OffchainMessageEnvelope {
    const { version } = offchainMessage;
    switch (version) {
        case 0:
            return compileOffchainMessageV0Envelope(offchainMessage);
        case 1:
            return compileOffchainMessageV1Envelope(offchainMessage);
        default:
            throw new SolanaError(SOLANA_ERROR__INVARIANT_VIOLATION__SWITCH_MUST_BE_EXHAUSTIVE, {
                unexpectedValue: version satisfies never,
            });
    }
}
