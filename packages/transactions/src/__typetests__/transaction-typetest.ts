import type {
    CompilableTransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
    TransactionMessageWithinSizeLimit,
} from '@solana/transaction-messages';

import type {
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
    TransactionWithLifetime,
} from '../lifetime';
import type { Transaction, TransactionFromCompilableTransactionMessage } from '../transaction';
import { TransactionWithinSizeLimit } from '../transaction-size';

// [DESCRIBE] TransactionFromCompilableTransactionMessage.
{
    // It returns a transaction with a lifetime constraint.
    {
        type Result = TransactionFromCompilableTransactionMessage<CompilableTransactionMessage>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
    }

    // It does not keep extra properties from the transaction message.
    {
        type Result = TransactionFromCompilableTransactionMessage<CompilableTransactionMessage & { some: 1 }>;
        null as unknown as Result satisfies Readonly<Transaction>;
        // @ts-expect-error Does not keep extra properties from transaction messages.
        null as unknown as Result satisfies Readonly<{ some: 1 }>;
    }

    // It forwards the blockhash lifetime constraint from the transaction message to the transaction.
    {
        type Result = TransactionFromCompilableTransactionMessage<
            CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
    }

    // It forwards the durable nonce lifetime constraint from the transaction message to the transaction.
    {
        type Result = TransactionFromCompilableTransactionMessage<
            CompilableTransactionMessage & TransactionMessageWithDurableNonceLifetime
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
    }

    // It forwards the within size limit flag from the transaction message to the transaction.
    {
        type Result = TransactionFromCompilableTransactionMessage<
            CompilableTransactionMessage & TransactionMessageWithinSizeLimit
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithinSizeLimit>;
    }
}
