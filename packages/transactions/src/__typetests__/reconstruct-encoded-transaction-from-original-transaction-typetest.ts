/* eslint-disable @typescript-eslint/no-floating-promises */
import type { ReadonlyUint8Array } from '@solana/codecs-core';

import type { TransactionWithLifetime } from '../lifetime';
import { reconstructEncodedTransactionFromOriginalTransaction } from '../reconstruct-encoded-transaction-from-original-transaction';
import type { Transaction } from '../transaction';
import type { TransactionWithinSizeLimit } from '../transaction-size';

// [DESCRIBE] reconstructEncodedTransactionFromOriginalTransaction
{
    // It accepts a transaction without a lifetime and encoded bytes.
    {
        const originalTransaction = {} as Transaction;
        const encodedTransaction = {} as Uint8Array;
        reconstructEncodedTransactionFromOriginalTransaction(originalTransaction, encodedTransaction) satisfies Promise<
            Transaction & TransactionWithinSizeLimit & TransactionWithLifetime
        >;
    }

    // It accepts a transaction that already has a lifetime.
    {
        const originalTransaction = {} as Transaction & TransactionWithLifetime;
        const encodedTransaction = {} as ReadonlyUint8Array;
        reconstructEncodedTransactionFromOriginalTransaction(originalTransaction, encodedTransaction) satisfies Promise<
            Transaction & TransactionWithinSizeLimit & TransactionWithLifetime
        >;
    }

    // @ts-expect-error The first argument must be a Transaction.
    reconstructEncodedTransactionFromOriginalTransaction({}, new Uint8Array());
}
