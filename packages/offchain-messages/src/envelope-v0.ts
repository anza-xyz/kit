import { getOffchainMessageV0Encoder } from './codecs/message-v0';
import { OffchainMessageEnvelope, OffchainMessageSignaturesMap } from './envelope';
import { OffchainMessageBytes } from './message';
import { OffchainMessageV0 } from './message-v0';

/**
 * Returns an {@link OffchainMessageEnvelope} object for a given {@link OffchainMessageV0}.
 *
 * This includes the compiled bytes of the offchain message, and a map of signatures. This map will
 * have a key for each address that is required to sign the message. The message envelope will not
 * yet have signatures for any of these addresses.
 */
export function compileOffchainMessageV0Envelope(offchainMessage: OffchainMessageV0): OffchainMessageEnvelope {
    const offchainMessageBytes = getOffchainMessageV0Encoder().encode(offchainMessage) as OffchainMessageBytes;
    const signatures: OffchainMessageSignaturesMap = {};
    for (const { address } of offchainMessage.requiredSigners) {
        signatures[address] = null;
    }
    return Object.freeze({
        content: offchainMessageBytes,
        signatures: Object.freeze(signatures),
    });
}
