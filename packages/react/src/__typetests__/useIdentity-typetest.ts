/* eslint-disable react-hooks/rules-of-hooks */

import type { ClientWithIdentity, ClientWithSubscribeToIdentity, TransactionSigner } from '@solana/kit';

import { useIdentity } from '../useIdentity';

// [DESCRIBE] useIdentity
{
    // It returns the identity signer (or undefined while absent) for a static client
    {
        const client = {} as ClientWithIdentity;
        useIdentity(client) satisfies TransactionSigner | undefined;
    }

    // It accepts a reactive client that also advertises subscribeToIdentity
    {
        const client = {} as ClientWithIdentity & ClientWithSubscribeToIdentity;
        useIdentity(client) satisfies TransactionSigner | undefined;
    }

    // It rejects a client that lacks an identity
    {
        const client = {} as ClientWithSubscribeToIdentity;
        // @ts-expect-error - client must have an identity
        useIdentity(client);
    }
}
