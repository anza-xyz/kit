import { CompilableTransactionMessage, TransactionMessageWithinSizeLimit } from '@solana/transaction-messages';

import {
    assertIsTransactionMessageWithinSizeLimit,
    isTransactionMessageWithinSizeLimit,
} from '../transaction-message-size';

// [DESCRIBE] isTransactionMessageWithinSizeLimit.
{
    // It narrows the type of the transaction message to include the `TransactionMessageWithinSizeLimit` flag.
    {
        const transactionMessage = null as unknown as CompilableTransactionMessage;
        if (isTransactionMessageWithinSizeLimit(transactionMessage)) {
            transactionMessage satisfies CompilableTransactionMessage & TransactionMessageWithinSizeLimit;
        }
    }

    // It keeps any extra properties from the transaction message.
    {
        const transactionMessage = null as unknown as CompilableTransactionMessage & { some: 1 };
        if (isTransactionMessageWithinSizeLimit(transactionMessage)) {
            transactionMessage satisfies CompilableTransactionMessage & { some: 1 };
        }
    }
}

// [DESCRIBE] assertIsTransactionMessageWithinSizeLimit.
{
    // It narrows the type of the transaction message to include the `TransactionMessageWithinSizeLimit` flag.
    {
        const transactionMessage = null as unknown as CompilableTransactionMessage;
        assertIsTransactionMessageWithinSizeLimit(transactionMessage);
        transactionMessage satisfies CompilableTransactionMessage & TransactionMessageWithinSizeLimit;
    }

    // It keeps any extra properties from the transaction message.
    {
        const transactionMessage = null as unknown as CompilableTransactionMessage & { some: 1 };
        assertIsTransactionMessageWithinSizeLimit(transactionMessage);
        transactionMessage satisfies CompilableTransactionMessage & { some: 1 };
    }
}
