import { Transaction } from '../transaction';
import {
    assertIsTransactionWithinSizeLimit,
    isTransactionWithinSizeLimit,
    TransactionWithinSizeLimit,
} from '../transaction-size';

// isTransactionWithinSizeLimit
{
    const transaction = null as unknown as Transaction & { some: 1 };
    if (isTransactionWithinSizeLimit(transaction)) {
        transaction satisfies Transaction & TransactionWithinSizeLimit & { some: 1 };
    }
}

// assertIsTransactionWithinSizeLimit
{
    const transaction = null as unknown as Transaction & { some: 1 };
    assertIsTransactionWithinSizeLimit(transaction);
    transaction satisfies Transaction & TransactionWithinSizeLimit & { some: 1 };
}
