import { Address } from '@solana/addresses';
import { SignatureBytes } from '@solana/keys';

import { getOffchainMessageEncoder } from './codecs/message';
import { OffchainMessage, OffchainMessageBytes } from './message';

type OrderedMap<K extends string, V> = Record<K, V>;
export type OffchainMessageSignaturesMap = OrderedMap<Address, SignatureBytes | null>;

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
 * yet have signatures for any of these addresses.
 */
export function compileOffchainMessageEnvelope(offchainMessage: OffchainMessage): OffchainMessageEnvelope {
    const offchainMessageBytes = getOffchainMessageEncoder().encode(offchainMessage) as OffchainMessageBytes;
    const signatures: OffchainMessageSignaturesMap = {};
    for (const { address } of offchainMessage.requiredSigners) {
        signatures[address] = null;
    }
    return Object.freeze({
        content: offchainMessageBytes,
        signatures: Object.freeze(signatures),
    });
}
