import type {
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
    TransactionMessageWithLifetime,
} from '@solana/transaction-messages';

import type {
    SetTransactionLifetimeFromTransactionMessage,
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
    TransactionWithLifetime,
} from '../lifetime';
import { Transaction } from '../transaction';

// [DESCRIBE] SetTransactionLifetimeFromTransactionMessage.
{
    // It returns the transaction unchanged if the transaction message has no lifetime constraint.
    {
        type Result = SetTransactionLifetimeFromTransactionMessage<Transaction, TransactionMessage>;
        null as unknown as Result satisfies Readonly<Transaction>;
        // @ts-expect-error Expects no lifetime constraint.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
    }

    // It augments the provided transaction with a lifetime constraint if the transaction message has a lifetime constraint.
    {
        type Result = SetTransactionLifetimeFromTransactionMessage<
            Transaction,
            TransactionMessage & TransactionMessageWithLifetime
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
        // @ts-expect-error Cannot know that the lifetime constraint is a blockhash lifetime.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
        // @ts-expect-error Cannot know that the lifetime constraint is a durable nonce lifetime.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
    }

    // It keeps extra properties from the transaction but not from the transaction message.
    {
        type Result = SetTransactionLifetimeFromTransactionMessage<
            Transaction & { _from_transaction: 1 },
            TransactionMessage & { _from_transaction_message: 1 }
        >;
        null as unknown as Result satisfies Readonly<{ _from_transaction: 1 }>;
        // @ts-expect-error Does not keep extra properties from transaction messages.
        null as unknown as Result satisfies Readonly<{ _from_transaction_message: 1 }>;
    }

    // It forwards the blockhash lifetime constraint from the transaction message to the transaction.
    {
        type Result = SetTransactionLifetimeFromTransactionMessage<
            Transaction,
            TransactionMessage & TransactionMessageWithBlockhashLifetime
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
        // @ts-expect-error Cannot be a durable nonce lifetime.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
    }

    // It forwards the durable nonce lifetime constraint from the transaction message to the transaction.
    {
        type Result = SetTransactionLifetimeFromTransactionMessage<
            Transaction,
            TransactionMessage & TransactionMessageWithDurableNonceLifetime
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
        // @ts-expect-error Cannot be a blockhash lifetime.
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
    }
}
