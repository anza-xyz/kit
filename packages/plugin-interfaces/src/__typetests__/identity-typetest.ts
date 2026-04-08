import type { TransactionSigner } from '@solana/signers';

import type { ClientWithIdentity } from '../identity';

// [DESCRIBE] ClientWithIdentity.
{
    // It provides an identity property that is a TransactionSigner.
    {
        const client = null as unknown as ClientWithIdentity;
        client.identity satisfies TransactionSigner;
    }

    // It can be combined with other interfaces via intersection.
    {
        type CustomClient = ClientWithIdentity & { customMethod(): void };
        const client = null as unknown as CustomClient;
        client.identity satisfies TransactionSigner;
        client.customMethod satisfies () => void;
    }
}
