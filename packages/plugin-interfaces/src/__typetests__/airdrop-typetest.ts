import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { Lamports } from '@solana/rpc-types';

import type { ClientWithAirdrop } from '../airdrop';

const address = null as unknown as Address;
const amount = null as unknown as Lamports;

// [DESCRIBE] ClientWithAirdrop.
{
    // It provides an airdrop method with the correct signature.
    {
        const client = null as unknown as ClientWithAirdrop;
        void (client.airdrop(address, amount) satisfies Promise<Signature | undefined>);
    }

    // It accepts an optional AbortSignal.
    {
        const client = null as unknown as ClientWithAirdrop;
        const abortController = new AbortController();
        void (client.airdrop(address, amount, abortController.signal) satisfies Promise<Signature | undefined>);
    }

    // It can be combined with other interfaces via intersection.
    {
        type CustomClient = ClientWithAirdrop & { otherMethod(): string };
        const client = null as unknown as CustomClient;
        client.airdrop satisfies ClientWithAirdrop['airdrop'];
        client.otherMethod satisfies () => string;
    }
}
