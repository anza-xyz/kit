import type { Lamports } from '../lamports';
import type { TokenBalance } from '../token-balance';
import type {
    TransactionForAccounts,
    TransactionForFullBase58,
    TransactionForFullBase64,
    TransactionForFullJson,
    TransactionForFullJsonParsed,
} from '../transaction';

// [DESCRIBE] TransactionForFullJson
{
    // The version 1 compute budget is reachable on the message without a cast
    {
        const transaction = null as unknown as TransactionForFullJson<0>;
        transaction.transaction.message.transactionConfig satisfies
            | Readonly<{
                  computeUnitLimit: number | null;
                  heapSize: number | null;
                  loadedAccountsDataSizeLimit: number | null;
                  priorityFee: Lamports | null;
              }>
            | undefined;
    }

    // The three `u32` fields are numbers rather than bigints
    {
        const transaction = null as unknown as TransactionForFullJson<0>;
        const config = transaction.transaction.message.transactionConfig;
        config?.computeUnitLimit satisfies number | null | undefined;
        config?.heapSize satisfies number | null | undefined;
        config?.loadedAccountsDataSizeLimit satisfies number | null | undefined;
    }

    // The `u64` priority fee is a `Lamports`, which is a branded bigint
    {
        const transaction = null as unknown as TransactionForFullJson<0>;
        transaction.transaction.message.transactionConfig?.priorityFee satisfies Lamports | null | undefined;
        // @ts-expect-error A `u32` field is not a bigint.
        transaction.transaction.message.transactionConfig?.computeUnitLimit satisfies bigint | null | undefined;
    }
}

// [DESCRIBE] TransactionForFullJsonParsed
{
    // The version 1 compute budget is reachable under `jsonParsed` encoding too
    {
        const transaction = null as unknown as TransactionForFullJsonParsed<0>;
        transaction.transaction.message.transactionConfig?.computeUnitLimit satisfies number | null | undefined;
        transaction.transaction.message.transactionConfig?.priorityFee satisfies Lamports | null | undefined;
    }
}

// [DESCRIBE] Block transaction metadata arrays
{
    // Every encoding and both legacy and versioned responses accept the same metadata states.
    /* eslint-disable @typescript-eslint/no-duplicate-type-constituents -- Cover every encoding and version branch even when metadata shapes coincide. */
    type FullMeta = NonNullable<TransactionForFullBase58<0 | 1>['meta']> &
        NonNullable<TransactionForFullBase58<void>['meta']> &
        NonNullable<TransactionForFullBase64<0 | 1>['meta']> &
        NonNullable<TransactionForFullBase64<void>['meta']> &
        NonNullable<TransactionForFullJson<0 | 1>['meta']> &
        NonNullable<TransactionForFullJson<void>['meta']> &
        NonNullable<TransactionForFullJsonParsed<0 | 1>['meta']> &
        NonNullable<TransactionForFullJsonParsed<void>['meta']>;
    type AccountsMeta = NonNullable<TransactionForAccounts<0 | 1>['meta']> &
        NonNullable<TransactionForAccounts<void>['meta']>;
    /* eslint-enable @typescript-eslint/no-duplicate-type-constituents */
    type FullArrayFields = Pick<FullMeta, 'innerInstructions' | 'postTokenBalances' | 'preTokenBalances'>;
    type AccountsArrayFields = Pick<AccountsMeta, 'postTokenBalances' | 'preTokenBalances'>;

    // Null, omitted, and empty arrays are distinct valid states.
    ({ innerInstructions: null, postTokenBalances: null, preTokenBalances: null }) satisfies FullArrayFields;
    ({}) satisfies FullArrayFields;
    ({ innerInstructions: [], postTokenBalances: [], preTokenBalances: [] }) satisfies FullArrayFields;
    ({ postTokenBalances: null, preTokenBalances: null }) satisfies AccountsArrayFields;
    ({}) satisfies AccountsArrayFields;
    ({ postTokenBalances: [], preTokenBalances: [] }) satisfies AccountsArrayFields;

    // Nullable/optional metadata requires a guard before array operations.
    const fullMeta = null as unknown as FullMeta;
    // @ts-expect-error Inner instructions can be null or omitted.
    fullMeta.innerInstructions.map(group => group.index);
    // @ts-expect-error Token balances can be null or omitted.
    fullMeta.preTokenBalances.map(balance => balance.accountIndex);
    // @ts-expect-error Token balances can still be null after an undefined-only guard.
    if (fullMeta.postTokenBalances !== undefined) fullMeta.postTokenBalances.map(balance => balance.accountIndex);

    if (fullMeta.innerInstructions != null) {
        fullMeta.innerInstructions.map(group => group.index) satisfies number[];
        // @ts-expect-error Inner instruction arrays remain readonly.
        fullMeta.innerInstructions.push(fullMeta.innerInstructions[0]);
        // @ts-expect-error Nested instruction arrays remain readonly.
        fullMeta.innerInstructions[0].instructions.push(fullMeta.innerInstructions[0].instructions[0]);
    }
    if (fullMeta.preTokenBalances != null) {
        fullMeta.preTokenBalances satisfies readonly TokenBalance[];
        fullMeta.preTokenBalances.map(balance => balance.accountIndex) satisfies number[];
        // @ts-expect-error Token balance arrays remain readonly.
        fullMeta.preTokenBalances.push(fullMeta.preTokenBalances[0]);
    }

    const accountsMeta = null as unknown as AccountsMeta;
    // @ts-expect-error Accounts mode token balances can be null or omitted.
    accountsMeta.postTokenBalances.map(balance => balance.accountIndex);
    if (accountsMeta.postTokenBalances != null) {
        accountsMeta.postTokenBalances satisfies readonly TokenBalance[];
        accountsMeta.postTokenBalances.map(balance => balance.accountIndex) satisfies number[];
        // @ts-expect-error Accounts mode token balance arrays remain readonly.
        accountsMeta.postTokenBalances.push(accountsMeta.postTokenBalances[0]);
    }
    // @ts-expect-error Metadata properties remain readonly.
    fullMeta.innerInstructions = [];
    // @ts-expect-error Accounts mode metadata properties remain readonly.
    accountsMeta.preTokenBalances = [];
}
