import type { Lamports } from '../lamports';
import type { TransactionForFullJson, TransactionForFullJsonParsed } from '../transaction';

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
