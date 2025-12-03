import { assertIsSendableTransaction, isSendableTransaction, SendableTransaction } from '../sendable-transaction';
import { FullySignedTransaction } from '../signatures';
import { Transaction } from '../transaction';
import { TransactionWithinSizeLimit } from '../transaction-size';

// [DESCRIBE] SendableTransaction.
{
    // It must have all the required conditions.
    {
        null as unknown as FullySignedTransaction &
            Transaction &
            TransactionWithinSizeLimit satisfies SendableTransaction;
    }

    // It is not satisfied by Transaction alone.
    {
        // @ts-expect-error No required conditions.
        null as unknown as Transaction satisfies SendableTransaction;
    }

    // It is not satisfied by Transaction with missing required conditions.
    {
        // @ts-expect-error Not enough required conditions.
        null as unknown as FullySignedTransaction & Transaction satisfies SendableTransaction;
        // @ts-expect-error Not enough required conditions.
        null as unknown as Transaction & TransactionWithinSizeLimit satisfies SendableTransaction;
    }
}

// [DESCRIBE] isSendableTransaction.
{
    // It narrows the type to a SendableTransaction.
    {
        const transaction = null as unknown as Transaction;
        if (isSendableTransaction(transaction)) {
            transaction satisfies SendableTransaction;
            transaction satisfies FullySignedTransaction;
            transaction satisfies TransactionWithinSizeLimit;
        } else {
            // @ts-expect-error Not sendable.
            transaction satisfies SendableTransaction;
            // @ts-expect-error Not fully signed.
            transaction satisfies FullySignedTransaction;
            // @ts-expect-error Not within size limit.
            transaction satisfies TransactionWithinSizeLimit;
        }
    }
}

// [DESCRIBE] assertIsSendableTransaction.
{
    // It narrows the type to a SendableTransaction.
    {
        const transaction = null as unknown as Transaction;
        assertIsSendableTransaction(transaction);
        transaction satisfies SendableTransaction;
        transaction satisfies FullySignedTransaction;
        transaction satisfies TransactionWithinSizeLimit;
    }
}
