import { Blockhash } from '@solana/rpc-types';

import {
    assertIsTransactionMessageWithBlockhashLifetime,
    isTransactionMessageWithBlockhashLifetime,
    setTransactionMessageLifetimeUsingBlockhash,
    TransactionMessageWithBlockhashLifetime,
} from '../blockhash';
import { BaseTransactionMessage, TransactionMessage } from '../transaction-message';

const mockBlockhash = null as unknown as Blockhash;
const mockBlockhashLifetime = { blockhash: mockBlockhash, lastValidBlockHeight: 0n };

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;

// [DESCRIBE] isTransactionMessageWithBlockhashLifetime
{
    // It narrows the transaction message type to one with a blockhash-based lifetime.
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        if (isTransactionMessageWithBlockhashLifetime(message)) {
            message satisfies BaseTransactionMessage & TransactionMessageWithBlockhashLifetime & { some: 1 };
        } else {
            message satisfies BaseTransactionMessage & { some: 1 };
            // @ts-expect-error It does not have a blockhash-based lifetime.
            message satisfies TransactionMessageWithBlockhashLifetime;
        }
    }
}

// [DESCRIBE] assertIsTransactionMessageWithBlockhashLifetime
{
    // It narrows the transaction message type to one with a blockhash-based lifetime.
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        // @ts-expect-error Should not be blockhash lifetime
        message satisfies TransactionMessageWithBlockhashLifetime;
        // @ts-expect-error Should not satisfy has blockhash
        message satisfies { lifetimeConstraint: { blockhash: Blockhash } };
        // @ts-expect-error Should not satisfy has lastValidBlockHeight
        message satisfies { lifetimeConstraint: { lastValidBlockHeight: bigint } };
        assertIsTransactionMessageWithBlockhashLifetime(message);
        message satisfies BaseTransactionMessage & TransactionMessageWithBlockhashLifetime & { some: 1 };
        message satisfies TransactionMessageWithBlockhashLifetime;
        message satisfies { lifetimeConstraint: { blockhash: Blockhash } };
        message satisfies { lifetimeConstraint: { lastValidBlockHeight: bigint } };
    }
}

// [DESCRIBE] setTransactionMessageLifetimeUsingBlockhash
{
    // It sets the blockhash lifetime on the transaction message for v0 messages.
    {
        const message = null as unknown as V0TransactionMessage & { some: 1 };
        const newMessage = setTransactionMessageLifetimeUsingBlockhash(mockBlockhashLifetime, message);
        newMessage satisfies TransactionMessageWithBlockhashLifetime & V0TransactionMessage & { some: 1 };
        // @ts-expect-error Should not be a legacy message.
        newMessage satisfies LegacyTransactionMessage & TransactionMessageWithBlockhashLifetime & { some: 1 };
    }

    // It sets the blockhash lifetime on the transaction message for legacy messages.
    {
        const message = null as unknown as LegacyTransactionMessage & { some: 1 };
        const newMessage = setTransactionMessageLifetimeUsingBlockhash(mockBlockhashLifetime, message);
        newMessage satisfies LegacyTransactionMessage & TransactionMessageWithBlockhashLifetime & { some: 1 };
        // @ts-expect-error Should not be a v0 message.
        newMessage satisfies TransactionMessageWithBlockhashLifetime & V0TransactionMessage & { some: 1 };
    }
}
