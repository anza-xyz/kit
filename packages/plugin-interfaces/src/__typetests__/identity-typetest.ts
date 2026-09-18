import type { TransactionSigner } from '@solana/signers';

import { assertIsClientWithIdentity, type ClientWithIdentity, isClientWithIdentity } from '../identity';

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

// [DESCRIBE] isClientWithIdentity.
{
    // It narrows the client to a ClientWithIdentity whilst keeping its other properties.
    {
        const client = null as unknown as { customMethod(): void };
        if (isClientWithIdentity(client)) {
            client.identity satisfies TransactionSigner;
            client.customMethod satisfies () => void;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { customMethod(): void };
        if (!isClientWithIdentity(client)) {
            // @ts-expect-error The client is not known to have an identity.
            client.identity satisfies TransactionSigner;
        }
    }
}

// [DESCRIBE] assertIsClientWithIdentity.
{
    // It narrows the client to a ClientWithIdentity whilst keeping its other properties.
    {
        const client = null as unknown as { customMethod(): void };
        assertIsClientWithIdentity(client);
        client.identity satisfies TransactionSigner;
        client.customMethod satisfies () => void;
    }
}
