import { address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';

import { AccountSignerMeta } from '../account-signer-meta';
import { TransactionSigner } from '../transaction-signer';

{
    // [AccountSignerMeta]: It adds a transaction signer to a valid account meta.
    ({
        address: address('1'),
        role: AccountRole.READONLY_SIGNER,
        signer: {} as TransactionSigner,
    }) satisfies AccountSignerMeta;
}

{
    // [AccountSignerMeta]: It fails if the signer is not a transaction signer.
    ({
        address: address('1'),
        role: AccountRole.READONLY_SIGNER,
        // @ts-expect-error Signer is not a transaction signer.
        signer: {} as MessageSigner,
    }) satisfies AccountSignerMeta;
}

{
    // [AccountSignerMeta]: It fails if the account meta is not a signer.
    ({
        address: address('1'),
        // @ts-expect-error Role is not a signer role.
        role: AccountRole.READONLY,
        signer: {} as TransactionSigner,
    }) satisfies AccountSignerMeta;
}
