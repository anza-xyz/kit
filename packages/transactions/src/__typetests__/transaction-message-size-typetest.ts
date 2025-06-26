import {
    BaseTransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionMessageWithinSizeLimit,
} from '@solana/transaction-messages';

import {
    assertIsTransactionMessageWithinSizeLimit,
    isTransactionMessageWithinSizeLimit,
} from '../transaction-message-size';

// [DESCRIBE] isTransactionMessageWithinSizeLimit.
{
    // It narrows the type of the transaction message to include the `TransactionMessageWithinSizeLimit` flag.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer;
        if (isTransactionMessageWithinSizeLimit(transactionMessage)) {
            transactionMessage satisfies BaseTransactionMessage &
                TransactionMessageWithFeePayer &
                TransactionMessageWithinSizeLimit;
        }
    }

    // It keeps any extra properties from the transaction message.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage &
            TransactionMessageWithFeePayer & { some: 1 };
        if (isTransactionMessageWithinSizeLimit(transactionMessage)) {
            transactionMessage satisfies BaseTransactionMessage & TransactionMessageWithFeePayer & { some: 1 };
        }
    }
}

// [DESCRIBE] assertIsTransactionMessageWithinSizeLimit.
{
    // It narrows the type of the transaction message to include the `TransactionMessageWithinSizeLimit` flag.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & TransactionMessageWithFeePayer;
        assertIsTransactionMessageWithinSizeLimit(transactionMessage);
        transactionMessage satisfies BaseTransactionMessage &
            TransactionMessageWithFeePayer &
            TransactionMessageWithinSizeLimit;
    }

    // It keeps any extra properties from the transaction message.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage &
            TransactionMessageWithFeePayer & { some: 1 };
        assertIsTransactionMessageWithinSizeLimit(transactionMessage);
        transactionMessage satisfies BaseTransactionMessage & TransactionMessageWithFeePayer & { some: 1 };
    }
}
