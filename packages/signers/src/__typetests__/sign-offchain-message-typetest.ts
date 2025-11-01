/* eslint-disable @typescript-eslint/no-floating-promises */
import {
    FullySignedOffchainMessageEnvelope,
    OffchainMessage,
    OffchainMessageEnvelope,
} from '@solana/offchain-messages';

import { OffchainMessageWithSigners } from '../offchain-message-signer';
import { partiallySignOffchainMessageWithSigners, signOffchainMessageWithSigners } from '../sign-offchain-message';

{
    // [partiallySignOffchainMessageWithSigners]: returns a offchain message envelope with a lifetime when the input message has a blockhash lifetime
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    partiallySignOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
}

{
    // [partiallySignOffchainMessageWithSigners]: returns a offchain-message with a lifetime when the input message has a durable nonce lifetime
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    partiallySignOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
}

{
    // [partiallySignOffchainMessageWithSigners]: returns a offchain-message with an unknown lifetime when the input message has an unknown lifetime
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    partiallySignOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
}

{
    // [partiallySignOffchainMessageWithSigners]: returns a offchain-message with a lifetime when the input message has no lifetime
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    partiallySignOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
    partiallySignOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
}

{
    // [signOffchainMessageWithSigners]: returns a fully signed offchain-message with a lifetime when the input message has a blockhash lifetime
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    signOffchainMessageWithSigners(offchainMessage) satisfies Promise<
        Readonly<FullySignedOffchainMessageEnvelope & OffchainMessageEnvelope>
    >;
}

{
    // [signOffchainMessageWithSigners]: returns a fully signed offchain-message with a lifetime when the input message has a durable nonce lifetime
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    signOffchainMessageWithSigners(offchainMessage) satisfies Promise<
        Readonly<FullySignedOffchainMessageEnvelope & OffchainMessageEnvelope>
    >;
}

{
    // [signOffchainMessageWithSigners]: returns a fully signed offchain-message with an unknown lifetime when the input message has an unknown lifetime
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    signOffchainMessageWithSigners(offchainMessage) satisfies Promise<
        Readonly<FullySignedOffchainMessageEnvelope & OffchainMessageEnvelope>
    >;
}

{
    // [signOffchainMessageWithSigners]: returns a offchain-message with a lifetime when the input message has no lifetime
    const offchainMessage = null as unknown as OffchainMessage & OffchainMessageWithSigners;
    signOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
    signOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
}
