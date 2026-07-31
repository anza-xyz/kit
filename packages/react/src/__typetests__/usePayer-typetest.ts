/* eslint-disable react-hooks/rules-of-hooks */

import type { ClientWithPayer, ClientWithSubscribeToPayer, TransactionSigner } from '@solana/kit';

import { usePayer } from '../usePayer';

// [DESCRIBE] usePayer
{
    // It returns the payer signer (or undefined while absent) for a static client
    {
        const client = {} as ClientWithPayer;
        usePayer(client) satisfies TransactionSigner | undefined;
    }

    // It accepts a reactive client that also advertises subscribeToPayer
    {
        const client = {} as ClientWithPayer & ClientWithSubscribeToPayer;
        usePayer(client) satisfies TransactionSigner | undefined;
    }

    // It rejects a client that lacks a payer
    {
        const client = {} as ClientWithSubscribeToPayer;
        // @ts-expect-error - client must have a payer
        usePayer(client);
    }
}
