import type { Lamports } from '@solana/rpc-types';

import {
    assertIsClientWithGetMinimumBalance,
    type ClientWithGetMinimumBalance,
    isClientWithGetMinimumBalance,
} from '../get-minimum-balance';

// [DESCRIBE] ClientWithGetMinimumBalance.
{
    // It provides a getMinimumBalance method with the correct signature.
    {
        const client = null as unknown as ClientWithGetMinimumBalance;
        void (client.getMinimumBalance(0) satisfies Promise<Lamports>);
    }

    // It accepts an optional config parameter.
    {
        const client = null as unknown as ClientWithGetMinimumBalance;
        void (client.getMinimumBalance(100, { withoutHeader: true }) satisfies Promise<Lamports>);
    }

    // It can be combined with other interfaces via intersection.
    {
        type CustomClient = ClientWithGetMinimumBalance & { otherMethod(): string };
        const client = null as unknown as CustomClient;
        client.getMinimumBalance satisfies ClientWithGetMinimumBalance['getMinimumBalance'];
        client.otherMethod satisfies () => string;
    }
}

// [DESCRIBE] isClientWithGetMinimumBalance.
{
    // It narrows the client to a ClientWithGetMinimumBalance whilst keeping its other properties.
    {
        const client = null as unknown as { otherMethod(): string };
        if (isClientWithGetMinimumBalance(client)) {
            void (client.getMinimumBalance(0) satisfies Promise<Lamports>);
            client.otherMethod satisfies () => string;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { otherMethod(): string };
        if (!isClientWithGetMinimumBalance(client)) {
            // @ts-expect-error The client is not known to have a getMinimumBalance function.
            client.getMinimumBalance satisfies ClientWithGetMinimumBalance['getMinimumBalance'];
        }
    }
}

// [DESCRIBE] assertIsClientWithGetMinimumBalance.
{
    // It narrows the client to a ClientWithGetMinimumBalance whilst keeping its other properties.
    {
        const client = null as unknown as { otherMethod(): string };
        assertIsClientWithGetMinimumBalance(client);
        void (client.getMinimumBalance(0) satisfies Promise<Lamports>);
        client.otherMethod satisfies () => string;
    }
}
