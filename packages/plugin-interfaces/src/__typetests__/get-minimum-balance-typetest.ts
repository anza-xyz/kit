import type { Lamports } from '@solana/rpc-types';

import type { ClientWithGetMinimumBalance } from '../get-minimum-balance';

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
