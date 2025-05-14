import type { BaseTransactionMessage, TransactionMessageWithinSizeLimit } from '@solana/transaction-messages';

import { Transaction } from '../transaction';
import {
    assertIsTransactionWithinSizeLimit,
    isTransactionWithinSizeLimit,
    SetTransactionWithinSizeLimitFromTransactionMessage,
    TransactionWithinSizeLimit,
} from '../transaction-size';

// [DESCRIBE] isTransactionWithinSizeLimit.
{
    // It narrows the type of the transaction to include the `TransactionWithinSizeLimit` flag.
    {
        const transaction = null as unknown as Transaction;
        if (isTransactionWithinSizeLimit(transaction)) {
            transaction satisfies Transaction & TransactionWithinSizeLimit;
        }
    }

    // It keeps any extra properties from the transaction.
    {
        const transaction = null as unknown as Transaction & { some: 1 };
        if (isTransactionWithinSizeLimit(transaction)) {
            transaction satisfies Transaction & { some: 1 };
        }
    }
}

// [DESCRIBE] assertIsTransactionWithinSizeLimit.
{
    // It narrows the type of the transaction to include the `TransactionWithinSizeLimit` flag.
    {
        const transaction = null as unknown as Transaction;
        assertIsTransactionWithinSizeLimit(transaction);
        transaction satisfies Transaction & TransactionWithinSizeLimit;
    }

    // It keeps any extra properties from the transaction.
    {
        const transaction = null as unknown as Transaction & { some: 1 };
        assertIsTransactionWithinSizeLimit(transaction);
        transaction satisfies Transaction & { some: 1 };
    }
}

// [DESCRIBE] SetTransactionWithinSizeLimitFromTransactionMessage.
{
    // It augments the provided transaction with the `TransactionWithinSizeLimit` flag.
    {
        type Result = SetTransactionWithinSizeLimitFromTransactionMessage<
            Transaction,
            BaseTransactionMessage & TransactionMessageWithinSizeLimit
        >;
        null as unknown as Result satisfies Transaction & TransactionWithinSizeLimit;
    }

    // It keeps any extra properties from the transaction but not from the transaction message.
    {
        type Result = SetTransactionWithinSizeLimitFromTransactionMessage<
            Transaction & { _from_transaction: 1 },
            BaseTransactionMessage & TransactionMessageWithinSizeLimit & { _from_transaction_message: 1 }
        >;
        null as unknown as Result satisfies { _from_transaction: 1 };
        // @ts-expect-error Does not keep extra properties from transaction messages.
        null as unknown as Result satisfies { _from_transaction_message: 1 };
    }

    // It returns the transaction as-is if the transaction message is not within size limit.
    {
        type Result = SetTransactionWithinSizeLimitFromTransactionMessage<
            Transaction & { some: 1 },
            BaseTransactionMessage
        >;
        null as unknown as Result satisfies Transaction & { some: 1 };
    }
}
