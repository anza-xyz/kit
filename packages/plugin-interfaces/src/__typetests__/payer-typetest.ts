import type { TransactionSigner } from '@solana/signers';

import type { ClientWithPayer } from '../payer';

// [DESCRIBE] ClientWithPayer.
{
    // It provides a payer property that is a TransactionSigner.
    {
        const client = null as unknown as ClientWithPayer;
        client.payer satisfies TransactionSigner;
    }

    // It can be combined with other interfaces via intersection.
    {
        type CustomClient = ClientWithPayer & { customMethod(): void };
        const client = null as unknown as CustomClient;
        client.payer satisfies TransactionSigner;
        client.customMethod satisfies () => void;
    }
}
