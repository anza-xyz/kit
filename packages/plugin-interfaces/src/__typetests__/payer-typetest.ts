import type { TransactionSigner } from '@solana/signers';

import { assertIsClientWithPayer, type ClientWithPayer, isClientWithPayer } from '../payer';

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

// [DESCRIBE] isClientWithPayer.
{
    // It narrows the client to a ClientWithPayer whilst keeping its other properties.
    {
        const client = null as unknown as { customMethod(): void };
        if (isClientWithPayer(client)) {
            client.payer satisfies TransactionSigner;
            client.customMethod satisfies () => void;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { customMethod(): void };
        if (!isClientWithPayer(client)) {
            // @ts-expect-error The client is not known to have a payer.
            client.payer satisfies TransactionSigner;
        }
    }
}

// [DESCRIBE] assertIsClientWithPayer.
{
    // It narrows the client to a ClientWithPayer whilst keeping its other properties.
    {
        const client = null as unknown as { customMethod(): void };
        assertIsClientWithPayer(client);
        client.payer satisfies TransactionSigner;
        client.customMethod satisfies () => void;
    }
}
