import type {
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
    TransactionMessageWithinSizeLimit,
} from '@solana/transaction-messages';

import type {
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
    TransactionWithLifetime,
} from '../lifetime';
import type { Transaction, TransactionFromTransactionMessage } from '../transaction';
import { TransactionWithinSizeLimit } from '../transaction-size';

// [DESCRIBE] TransactionFromTransactionMessage.
{
    // It returns a transaction with no lifetime constraint if the message has no lifetime constraint.
    {
        type Result = TransactionFromTransactionMessage<TransactionMessage>;
        null as unknown as Result satisfies Readonly<Transaction>;
        // @ts-expect-error Expects no lifetime constraint.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
    }

    // It returns a transaction with an unknown lifetime constraint when the message lifetime constraint exists but is unknown.
    {
        type Result = TransactionFromTransactionMessage<TransactionMessage & TransactionWithLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
        // @ts-expect-error Cannot know that the lifetime constraint is a blockhash lifetime.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
        // @ts-expect-error Cannot know that the lifetime constraint is a durable nonce lifetime.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
    }

    // It does not keep extra properties from the transaction message.
    {
        type Result = TransactionFromTransactionMessage<TransactionMessage & { some: 1 }>;
        null as unknown as Result satisfies Readonly<Transaction>;
        // @ts-expect-error Does not keep extra properties from transaction messages.
        null as unknown as Result satisfies Readonly<{ some: 1 }>;
    }

    // It forwards the blockhash lifetime constraint from the transaction message to the transaction.
    {
        type Result = TransactionFromTransactionMessage<TransactionMessage & TransactionMessageWithBlockhashLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
        // @ts-expect-error Cannot be a durable nonce lifetime.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
    }

    // It forwards the durable nonce lifetime constraint from the transaction message to the transaction.
    {
        type Result = TransactionFromTransactionMessage<
            TransactionMessage & TransactionMessageWithDurableNonceLifetime
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
        // @ts-expect-error Cannot be a blockhash lifetime.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
    }

    // It forwards the within size limit flag from the transaction message to the transaction.
    {
        type Result = TransactionFromTransactionMessage<TransactionMessage & TransactionMessageWithinSizeLimit>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithinSizeLimit>;
    }
}
