import type {
    CompilableTransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
} from '@solana/transaction-messages';

import type {
    SetTransactionLifetimeFromCompilableTransactionMessage,
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
    TransactionWithLifetime,
} from '../lifetime';
import { Transaction } from '../transaction';

// [DESCRIBE] SetTransactionLifetimeFromCompilableTransactionMessage.
{
    // It augments the provided transaction with a lifetime constraint.
    {
        type Result = SetTransactionLifetimeFromCompilableTransactionMessage<Transaction, CompilableTransactionMessage>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
    }

    // It keeps extra properties from the transaction but not from the transaction message.
    {
        type Result = SetTransactionLifetimeFromCompilableTransactionMessage<
            Transaction & { _from_transaction: 1 },
            CompilableTransactionMessage & { _from_transaction_message: 1 }
        >;
        null as unknown as Result satisfies Readonly<{ _from_transaction: 1 }>;
        // @ts-expect-error Does not keep extra properties from transaction messages.
        null as unknown as Result satisfies Readonly<{ _from_transaction_message: 1 }>;
    }

    // It forwards the blockhash lifetime constraint from the transaction message to the transaction.
    {
        type Result = SetTransactionLifetimeFromCompilableTransactionMessage<
            Transaction,
            CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
    }

    // It forwards the durable nonce lifetime constraint from the transaction message to the transaction.
    {
        type Result = SetTransactionLifetimeFromCompilableTransactionMessage<
            Transaction,
            CompilableTransactionMessage & TransactionMessageWithDurableNonceLifetime
        >;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
        null as unknown as Result satisfies Readonly<Transaction & TransactionWithLifetime>;
    }
}
