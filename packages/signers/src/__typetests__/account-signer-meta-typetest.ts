import { address } from '@solana/addresses';
import { AccountLookupMeta, AccountMeta, AccountRole } from '@solana/instructions';

import { AccountSignerMeta, NonSignerAccountMeta } from '../account-signer-meta';
import { TransactionSigner } from '../transaction-signer';

// [DESCRIBE] AccountSignerMeta
{
    {
        // It adds a transaction signer to a valid account meta.
        ({
            address: address('1'),
            role: AccountRole.READONLY_SIGNER,
            signer: {} as TransactionSigner,
        }) satisfies AccountSignerMeta;
    }

    {
        // It fails if the signer is not a transaction signer.
        ({
            address: address('1'),
            role: AccountRole.READONLY_SIGNER,
            // @ts-expect-error Signer is not a transaction signer.
            signer: {} as MessageSigner,
        }) satisfies AccountSignerMeta;
    }

    {
        // It fails if the account meta is not a signer.
        ({
            address: address('1'),
            // @ts-expect-error Role is not a signer role.
            role: AccountRole.READONLY,
            signer: {} as TransactionSigner,
        }) satisfies AccountSignerMeta;
    }
}

// [DESCRIBE] NonSignerAccountMeta
{
    // It allows an account meta that is not a signer.
    {
        const accountMeta = null as unknown as AccountMeta;
        accountMeta satisfies NonSignerAccountMeta;
    }

    // It allows an account lookup meta.
    {
        const accountLookupMeta = null as unknown as AccountLookupMeta;
        accountLookupMeta satisfies NonSignerAccountMeta;
    }

    // It fails if the account meta is a signer.
    {
        const signerAccountMeta = null as unknown as AccountMeta & { signer: TransactionSigner };
        // @ts-expect-error Account meta is a signer.
        signerAccountMeta satisfies NonSignerAccountMeta;
    }

    // It fails if the account lookup meta is a signer.
    {
        const signerAccountLookupMeta = null as unknown as AccountLookupMeta & { signer: TransactionSigner };
        // @ts-expect-error Account lookup meta is a signer.
        signerAccountLookupMeta satisfies NonSignerAccountMeta;
    }
}
