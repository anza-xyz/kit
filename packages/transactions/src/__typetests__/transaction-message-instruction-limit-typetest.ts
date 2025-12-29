import { BaseTransactionMessage, TransactionMessageWithinInstructionLimit } from '@solana/transaction-messages';

import {
    assertIsTransactionMessageWithinInstructionLimit,
    isTransactionMessageWithinInstructionLimit,
} from '../transaction-message-instruction-limit';

// [DESCRIBE] isTransactionMessageWithinInstructionLimit.
{
    // It narrows the type of the transaction message to include the `TransactionMessageWithinInstructionLimit` flag.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage;
        if (isTransactionMessageWithinInstructionLimit(transactionMessage)) {
            transactionMessage satisfies BaseTransactionMessage & TransactionMessageWithinInstructionLimit;
        }
    }

    // It keeps any extra properties from the transaction message.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & { some: 1 };
        if (isTransactionMessageWithinInstructionLimit(transactionMessage)) {
            transactionMessage satisfies BaseTransactionMessage & { some: 1 };
        }
    }
}

// [DESCRIBE] assertIsTransactionMessageWithinInstructionLimit.
{
    // It narrows the type of the transaction message to include the `TransactionMessageWithinInstructionLimit` flag.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage;
        assertIsTransactionMessageWithinInstructionLimit(transactionMessage);
        transactionMessage satisfies BaseTransactionMessage & TransactionMessageWithinInstructionLimit;
    }

    // It keeps any extra properties from the transaction message.
    {
        const transactionMessage = null as unknown as BaseTransactionMessage & { some: 1 };
        assertIsTransactionMessageWithinInstructionLimit(transactionMessage);
        transactionMessage satisfies BaseTransactionMessage & { some: 1 };
    }
}
