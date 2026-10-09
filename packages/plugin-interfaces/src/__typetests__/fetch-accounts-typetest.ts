import type { MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';

import {
    assertIsClientWithFetchAccounts,
    type ClientWithFetchAccounts,
    isClientWithFetchAccounts,
} from '../fetch-accounts';

// [DESCRIBE] ClientWithFetchAccounts.
{
    // It provides a fetchAccounts method with the correct signature.
    {
        const client = null as unknown as ClientWithFetchAccounts;
        void (client.fetchAccounts([] as Address[]) satisfies Promise<MaybeEncodedAccount[]>);
    }

    // It accepts an optional config parameter.
    {
        const client = null as unknown as ClientWithFetchAccounts;
        void (client.fetchAccounts([] as Address[], { commitment: 'confirmed' }) satisfies Promise<
            MaybeEncodedAccount[]
        >);
    }

    // It can be combined with other interfaces via intersection.
    {
        type CustomClient = ClientWithFetchAccounts & { otherMethod(): string };
        const client = null as unknown as CustomClient;
        client.fetchAccounts satisfies ClientWithFetchAccounts['fetchAccounts'];
        client.otherMethod satisfies () => string;
    }
}

// [DESCRIBE] isClientWithFetchAccounts.
{
    // It narrows the client to a ClientWithFetchAccounts whilst keeping its other properties.
    {
        const client = null as unknown as { otherMethod(): string };
        if (isClientWithFetchAccounts(client)) {
            void (client.fetchAccounts([] as Address[]) satisfies Promise<MaybeEncodedAccount[]>);
            client.otherMethod satisfies () => string;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { otherMethod(): string };
        if (!isClientWithFetchAccounts(client)) {
            // @ts-expect-error The client is not known to have a fetchAccounts function.
            client.fetchAccounts satisfies ClientWithFetchAccounts['fetchAccounts'];
        }
    }
}

// [DESCRIBE] assertIsClientWithFetchAccounts.
{
    // It narrows the client to a ClientWithFetchAccounts whilst keeping its other properties.
    {
        const client = null as unknown as { otherMethod(): string };
        assertIsClientWithFetchAccounts(client);
        void (client.fetchAccounts([] as Address[]) satisfies Promise<MaybeEncodedAccount[]>);
        client.otherMethod satisfies () => string;
    }
}
