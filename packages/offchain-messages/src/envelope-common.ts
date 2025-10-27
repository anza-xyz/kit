import { VariableSizeEncoder } from '@solana/codecs-core';

import { OffchainMessageEnvelope } from './envelope';
import { OffchainMessage, OffchainMessageBytes } from './message';

export function compileOffchainMessageEnvelopeUsingEncoder<T extends OffchainMessage>(
    offchainMessage: T,
    encoder: VariableSizeEncoder<T>,
) {
    const offchainMessageBytes = encoder.encode(offchainMessage) as OffchainMessageBytes;
    const signatures: OffchainMessageEnvelope['signatures'] = {};
    for (const { address } of offchainMessage.requiredSignatories) {
        signatures[address] = null;
    }
    return Object.freeze({
        content: offchainMessageBytes,
        signatures: Object.freeze(signatures),
    });
}
