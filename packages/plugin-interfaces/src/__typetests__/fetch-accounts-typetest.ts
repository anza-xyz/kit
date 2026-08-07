import type { MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';

import type { ClientWithFetchAccounts } from '../fetch-accounts';

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
