import { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import { createTransactionMessage } from '@solana/transaction-messages';

import { TransactionMessageWithSigners } from '../account-signer-meta';
import { setTransactionMessageFeePayerSigner } from '../fee-payer-signer';
import { TransactionModifyingSigner } from '../transaction-modifying-signer';
import { TransactionPartialSigner } from '../transaction-partial-signer';

// [DESCRIBE] TransactionMessageWithSigners
{
    // It rejects a fee payer whose signer type is outside the requested signer type
    {
        const signer = null as unknown as TransactionModifyingSigner;
        const transactionMessage = setTransactionMessageFeePayerSigner(
            signer,
            createTransactionMessage({ version: 0 }),
        );

        // @ts-expect-error The fee payer is not a TransactionPartialSigner.
        transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionPartialSigner>;
    }

    // It accepts plain fee payers and account metas without signers
    {
        const accountAddress = null as unknown as Address;
        ({
            feePayer: { address: accountAddress },
            instructions: [
                {
                    accounts: [
                        {
                            address: accountAddress,
                            role: AccountRole.READONLY,
                        },
                    ],
                    programAddress: accountAddress,
                },
            ],
        }) satisfies TransactionMessageWithSigners<Address, TransactionPartialSigner>;
    }

    // It accepts fee payer and instruction signers matching the requested signer type
    {
        const signer = null as unknown as TransactionPartialSigner;
        const transactionMessage = {
            feePayer: signer,
            instructions: [
                {
                    accounts: [
                        {
                            address: signer.address,
                            role: AccountRole.READONLY_SIGNER,
                            signer,
                        },
                    ],
                    programAddress: signer.address,
                },
            ],
        } as const;
        transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionPartialSigner>;
    }

    // It rejects an instruction signer outside the requested signer type
    {
        const signer = null as unknown as TransactionModifyingSigner;
        const transactionMessage = {
            instructions: [
                {
                    accounts: [
                        {
                            address: signer.address,
                            role: AccountRole.READONLY_SIGNER,
                            signer,
                        },
                    ],
                    programAddress: signer.address,
                },
            ],
        } as const;

        // @ts-expect-error The instruction signer is not a TransactionPartialSigner.
        transactionMessage satisfies TransactionMessageWithSigners<Address, TransactionPartialSigner>;
    }
}
