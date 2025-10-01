import { Address } from '@solana/addresses';
import { Blockhash } from '@solana/rpc-types';
import type {
    Nonce,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
    TransactionMessageWithLifetime,
} from '@solana/transaction-messages';

import {
    assertIsTransactionWithBlockhashLifetime,
    assertIsTransactionWithDurableNonceLifetime,
    isTransactionWithBlockhashLifetime,
    isTransactionWithDurableNonceLifetime,
    type SetTransactionLifetimeFromTransactionMessage,
    type TransactionWithBlockhashLifetime,
    type TransactionWithDurableNonceLifetime,
    type TransactionWithLifetime,
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

// [DESCRIBE] isTransactionWithBlockhashLifetime
{
    // It narrows the transaction type to one with a blockhash-based lifetime.
    {
        const transaction = null as unknown as Transaction & { some: 1 };
        if (isTransactionWithBlockhashLifetime(transaction)) {
            transaction satisfies Transaction & TransactionWithBlockhashLifetime & { some: 1 };
        } else {
            transaction satisfies Transaction & { some: 1 };
            // @ts-expect-error It does not have a blockhash-based lifetime.
            transaction satisfies TransactionWithBlockhashLifetime;
        }
    }
}

// [DESCRIBE] assertIsTransactionWithBlockhashLifetime
{
    // It narrows the transaction type to one with a blockhash-based lifetime.
    {
        const transaction = null as unknown as Transaction & { some: 1 };
        // @ts-expect-error Should not be blockhash lifetime
        transaction satisfies TransactionWithBlockhashLifetime;
        // @ts-expect-error Should not satisfy has blockhash
        transaction satisfies { lifetimeConstraint: { blockhash: Blockhash } };
        // @ts-expect-error Should not satisfy has lastValidBlockHeight
        transaction satisfies { lifetimeConstraint: { lastValidBlockHeight: bigint } };
        assertIsTransactionWithBlockhashLifetime(transaction);
        transaction satisfies Transaction & TransactionWithBlockhashLifetime & { some: 1 };
        transaction satisfies TransactionWithBlockhashLifetime;
        transaction satisfies { lifetimeConstraint: { blockhash: Blockhash } };
        transaction satisfies { lifetimeConstraint: { lastValidBlockHeight: bigint } };
    }
}

// [DESCRIBE] isTransactionWithDurableNonceLifetime
{
    // It narrows the transaction type to one with a nonce-based lifetime.
    {
        const transaction = null as unknown as Transaction & { some: 1 };
        if (isTransactionWithDurableNonceLifetime(transaction)) {
            transaction satisfies Transaction & TransactionWithDurableNonceLifetime & { some: 1 };
        } else {
            transaction satisfies Transaction & { some: 1 };
            // @ts-expect-error It does not have a nonce-based lifetime.
            transaction satisfies TransactionWithDurableNonceLifetime;
        }
    }
}

// [DESCRIBE] assertIsTransactionWithDurableNonceLifetime
{
    // It narrows the transaction type to one with a nonce-based lifetime.
    {
        const transaction = null as unknown as Transaction & { some: 1 };
        // @ts-expect-error Should not be durable nonce lifetime
        transaction satisfies TransactionWithDurableNonceLifetime;
        // @ts-expect-error Should not have a nonce-based lifetime
        transaction satisfies { lifetimeConstraint: { nonce: Nonce } };
        // @ts-expect-error Should not have a nonce account address
        transaction satisfies { lifetimeConstraint: { nonceAccountAddress: Address } };
        assertIsTransactionWithDurableNonceLifetime(transaction);
        transaction satisfies Transaction & TransactionWithDurableNonceLifetime & { some: 1 };
        transaction satisfies TransactionWithDurableNonceLifetime;
        transaction satisfies { lifetimeConstraint: { nonce: Nonce } };
        transaction satisfies { lifetimeConstraint: { nonceAccountAddress: Address } };
    }
}
