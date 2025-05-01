import { CompilableTransactionMessage } from '@solana/transaction-messages';

import {
    assertIsTransactionMessageWithinSizeLimit,
    isTransactionMessageWithinSizeLimit,
    TransactionMessageWithinSizeLimit,
} from '../transaction-message-size';

// isTransactionMessageWithinSizeLimit
{
    const transactionMessage = null as unknown as CompilableTransactionMessage & { some: 1 };
    if (isTransactionMessageWithinSizeLimit(transactionMessage)) {
        transactionMessage satisfies CompilableTransactionMessage & TransactionMessageWithinSizeLimit & { some: 1 };
    }
}

// assertIsTransactionMessageWithinSizeLimit
{
    const transactionMessage = null as unknown as CompilableTransactionMessage & { some: 1 };
    assertIsTransactionMessageWithinSizeLimit(transactionMessage);
    transactionMessage satisfies CompilableTransactionMessage & TransactionMessageWithinSizeLimit & { some: 1 };
}
