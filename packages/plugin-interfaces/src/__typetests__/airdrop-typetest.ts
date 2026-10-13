import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { Lamports } from '@solana/rpc-types';

import { assertIsClientWithAirdrop, type ClientWithAirdrop, isClientWithAirdrop } from '../airdrop';

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

// [DESCRIBE] isClientWithAirdrop.
{
    // It narrows the client to a ClientWithAirdrop whilst keeping its other properties.
    {
        const client = null as unknown as { otherMethod(): string };
        if (isClientWithAirdrop(client)) {
            void (client.airdrop(address, amount) satisfies Promise<Signature | undefined>);
            client.otherMethod satisfies () => string;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { otherMethod(): string };
        if (!isClientWithAirdrop(client)) {
            // @ts-expect-error The client is not known to have an airdrop function.
            client.airdrop satisfies ClientWithAirdrop['airdrop'];
        }
    }
}

// [DESCRIBE] assertIsClientWithAirdrop.
{
    // It narrows the client to a ClientWithAirdrop whilst keeping its other properties.
    {
        const client = null as unknown as { otherMethod(): string };
        assertIsClientWithAirdrop(client);
        void (client.airdrop(address, amount) satisfies Promise<Signature | undefined>);
        client.otherMethod satisfies () => string;
    }
}
