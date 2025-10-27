/* eslint-disable @typescript-eslint/no-floating-promises */
import {
    FullySignedOffchainMessageEnvelope,
    OffchainMessage,
    OffchainMessageEnvelope,
} from '@solana/offchain-messages';

import { OffchainMessageWithSigners } from '../offchain-message-signer';
import { partiallySignOffchainMessageWithSigners, signOffchainMessageWithSigners } from '../sign-offchain-message';

{
    // [partiallySignOffchainMessageWithSigners]: returns an offchain message envelope
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    partiallySignOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
}

{
    // [signOffchainMessageWithSigners]: returns a fully signed offchain-message envelope
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    signOffchainMessageWithSigners(offchainMessage) satisfies Promise<
        Readonly<FullySignedOffchainMessageEnvelope & OffchainMessageEnvelope>
    >;
}
