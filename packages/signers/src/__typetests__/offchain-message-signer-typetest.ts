import { Address } from '@solana/addresses';

import { MessageModifyingSigner } from '../message-modifying-signer';
import { MessagePartialSigner } from '../message-partial-signer';
import { MessageSigner } from '../message-signer';
import { getSignersFromOffchainMessage, OffchainMessageSignatorySigner } from '../offchain-message-signer';
import { TransactionModifyingSigner } from '../transaction-modifying-signer';
import { TransactionPartialSigner } from '../transaction-partial-signer';
import { TransactionSendingSigner } from '../transaction-sending-signer';
import { TransactionSigner } from '../transaction-signer';

// [DESCRIBE] `OffchainMessageSignatorySigner`.
{
    // It accepts a `MessageSigner` as a signatory
    {
        ({}) as MessageSigner satisfies OffchainMessageSignatorySigner;
        ({}) as MessageModifyingSigner satisfies OffchainMessageSignatorySigner;
        ({}) as MessagePartialSigner satisfies OffchainMessageSignatorySigner;
    }
    // It does not accept a `TransactionSigner` as a signatory
    {
        // @ts-expect-error You can not use a transaction signer here
        ({}) as TransactionSigner satisfies OffchainMessageSignatorySigner;
        // @ts-expect-error You can not use a transaction signer here
        ({}) as TransactionModifyingSigner satisfies OffchainMessageSignatorySigner;
        // @ts-expect-error You can not use a transaction signer here
        ({}) as TransactionPartialSigner satisfies OffchainMessageSignatorySigner;
        // @ts-expect-error You can not use a transaction signer here
        ({}) as TransactionSendingSigner satisfies OffchainMessageSignatorySigner;
    }
}

// [DESCRIBE] `getSignersFromOffchainMessage`.
{
    // It accepts `MessageSigners` among the `requiredSignatories`
    {
        getSignersFromOffchainMessage({
            requiredSignatories: [null as unknown as MessageSigner],
        });
    }

    // It accepts `MessagePartialSigners` among the `requiredSignatories`
    {
        getSignersFromOffchainMessage({
            requiredSignatories: [null as unknown as MessagePartialSigner],
        });
    }

    // It accepts `MessageModifyingSigners` among the `requiredSignatories`
    {
        getSignersFromOffchainMessage({
            requiredSignatories: [null as unknown as MessageModifyingSigner],
        });
    }

    // It accepts non signers among the `requiredSignatories`
    {
        getSignersFromOffchainMessage({
            requiredSignatories: [{ address: 'non-signer' as Address }],
        });
    }

    // It accepts a mix of signers and non signers among the `requiredSignatories`
    {
        getSignersFromOffchainMessage({
            requiredSignatories: [
                { address: 'non-signer' as Address },
                null as unknown as MessageModifyingSigner,
                null as unknown as MessagePartialSigner,
                null as unknown as MessageSigner,
            ],
        });
    }
}
