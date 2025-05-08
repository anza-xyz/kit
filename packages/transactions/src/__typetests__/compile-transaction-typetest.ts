import { Blockhash } from '@solana/rpc-types';
import {
    BaseTransactionMessage,
    CompilableTransactionMessage,
    Nonce,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
    TransactionMessageWithFeePayer,
    TransactionMessageWithinSizeLimit,
} from '@solana/transaction-messages';

import { compileTransaction } from '../compile-transaction';
import {
    TransactionBlockhashLifetime,
    TransactionDurableNonceLifetime,
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
    TransactionWithLifetime,
} from '../lifetime';
import { Transaction } from '../transaction';
import { TransactionWithinSizeLimit } from '../transaction-size';

// [DESCRIBE] compileTransaction.
{
    // It forwards the blockhash lifetime constraint from the transaction message to the transaction.
    {
        const transaction = compileTransaction(
            null as unknown as BaseTransactionMessage &
                TransactionMessageWithBlockhashLifetime &
                TransactionMessageWithFeePayer,
        );

        transaction satisfies Readonly<Transaction & TransactionWithLifetime>;
        transaction satisfies Readonly<Transaction & TransactionWithBlockhashLifetime>;
        transaction.lifetimeConstraint.blockhash satisfies Blockhash;
    }

    // It forwards the durable nonce lifetime constraint from the transaction message to the transaction.
    {
        const transaction = compileTransaction(
            null as unknown as BaseTransactionMessage &
                TransactionMessageWithDurableNonceLifetime &
                TransactionMessageWithFeePayer,
        );

        transaction satisfies Readonly<Transaction & TransactionWithLifetime>;
        transaction satisfies Readonly<Transaction & TransactionWithDurableNonceLifetime>;
        transaction.lifetimeConstraint.nonce satisfies Nonce;
    }

    // It returns a transaction with a lifetime constraint even if we don't know which one it is.
    {
        const transaction = compileTransaction(null as unknown as CompilableTransactionMessage);

        transaction satisfies Readonly<Transaction & TransactionWithLifetime>;
        // @ts-expect-error not known to have blockhash lifetime
        transaction satisfies Readonly<Transaction & TransactionBlockhashLifetime>;
        // @ts-expect-error not known to have durable nonce lifetime
        transaction satisfies Readonly<Transaction & TransactionDurableNonceLifetime>;

        transaction.lifetimeConstraint satisfies { blockhash: Blockhash } | { nonce: Nonce };
        // @ts-expect-error not known to have blockhash lifetime
        transaction.lifetimeConstraint satisfies { blockhash: Blockhash };
        // @ts-expect-error not known to have durable nonce lifetime
        transaction.lifetimeConstraint satisfies { nonce: Nonce };
    }

    // It forwards the within size limit flag from the transaction message to the transaction.
    {
        const transaction = compileTransaction(
            null as unknown as CompilableTransactionMessage & TransactionMessageWithinSizeLimit,
        );

        transaction satisfies Readonly<Transaction & TransactionWithinSizeLimit>;
    }
}
