/* eslint-disable @typescript-eslint/no-floating-promises */
import { Address } from '@solana/addresses';
import {
    FullySignedOffchainMessageEnvelope,
    OffchainMessage,
    OffchainMessageEnvelope,
} from '@solana/offchain-messages';

import { MessageModifyingSigner } from '../message-modifying-signer';
import { MessagePartialSigner } from '../message-partial-signer';
import { MessageSigner } from '../message-signer';
import { partiallySignOffchainMessageWithSigners, signOffchainMessageWithSigners } from '../sign-offchain-message';

// [DESCRIBE] `partiallySignOffchainMessageWithSigners`
{
    // It returns an offchain message envelope
    {
        const offchainMessage = null as unknown as OffchainMessage;
        partiallySignOffchainMessageWithSigners(offchainMessage) satisfies Promise<Readonly<OffchainMessageEnvelope>>;
    }

    // It accepts an offchain message with only non-signers
    {
        const offchainMessage = null as unknown as Omit<OffchainMessage, 'requiredSignatories'>;
        partiallySignOffchainMessageWithSigners({
            ...offchainMessage,
            requiredSignatories: [{ address: '123' as Address<'123'> }],
        });
    }

    // It accepts an offchain message with a mix of signers and non-signers
    {
        const offchainMessage = null as unknown as Omit<OffchainMessage, 'requiredSignatories'>;
        partiallySignOffchainMessageWithSigners({
            ...offchainMessage,
            requiredSignatories: [
                { address: '123' as Address<'123'> },
                {} as MessageModifyingSigner,
                {} as MessagePartialSigner,
                {} as MessageSigner,
            ],
        });
    }

    // It accepts an offchain message with only signers
    {
        const offchainMessage = null as unknown as Omit<OffchainMessage, 'requiredSignatories'>;
        partiallySignOffchainMessageWithSigners({
            ...offchainMessage,
            requiredSignatories: [{} as MessageModifyingSigner, {} as MessagePartialSigner, {} as MessageSigner],
        });
    }
}

// [DESCRIBE] `signOffchainMessageWithSigners`
{
    // It returns a fully signed offchain-message envelope
    {
        const offchainMessage = null as unknown as OffchainMessage;
        signOffchainMessageWithSigners(offchainMessage) satisfies Promise<
            Readonly<FullySignedOffchainMessageEnvelope & OffchainMessageEnvelope>
        >;
    }

    // It accepts an offchain message with only non-signers
    {
        const offchainMessage = null as unknown as Omit<OffchainMessage, 'requiredSignatories'>;
        signOffchainMessageWithSigners({
            ...offchainMessage,
            requiredSignatories: [{ address: '123' as Address<'123'> }],
        });
    }

    // It accepts an offchain message with a mix of signers and non-signers
    {
        const offchainMessage = null as unknown as Omit<OffchainMessage, 'requiredSignatories'>;
        signOffchainMessageWithSigners({
            ...offchainMessage,
            requiredSignatories: [
                { address: '123' as Address<'123'> },
                {} as MessageModifyingSigner,
                {} as MessagePartialSigner,
                {} as MessageSigner,
            ],
        });
    }

    // It accepts an offchain message with only signers
    {
        const offchainMessage = null as unknown as Omit<OffchainMessage, 'requiredSignatories'>;
        signOffchainMessageWithSigners({
            ...offchainMessage,
            requiredSignatories: [{} as MessageModifyingSigner, {} as MessagePartialSigner, {} as MessageSigner],
        });
    }
}
