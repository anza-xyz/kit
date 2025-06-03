import { Blockhash } from '@solana/rpc-types';

import {
    assertIsTransactionMessageWithBlockhashLifetime,
    fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash,
    isTransactionMessageWithBlockhashLifetime,
    setTransactionMessageLifetimeUsingBlockhash,
    setTransactionMessageLifetimeUsingProvisoryBlockhash,
    TransactionMessageWithBlockhashLifetime,
} from '../blockhash';
import { TransactionMessageWithDurableNonceLifetime } from '../durable-nonce';
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

// [DESCRIBE] setTransactionMessageLifetimeUsingProvisoryBlockhash
{
    // It sets the blockhash lifetime on the transaction message.
    {
        const message = null as unknown as TransactionMessage;
        const newMessage = setTransactionMessageLifetimeUsingProvisoryBlockhash(message);
        newMessage satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
        // @ts-expect-error Should not be a durable nonce lifetime.
        newMessage satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }

    // It overrides existing lifetime constraints on the transaction message.
    {
        const message = null as unknown as TransactionMessage & TransactionMessageWithDurableNonceLifetime;
        const newMessage = setTransactionMessageLifetimeUsingProvisoryBlockhash(message);
        newMessage satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
        // @ts-expect-error Should not be a durable nonce lifetime.
        newMessage satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }

    // It keeps any extra properties on the transaction message.
    {
        const message = null as unknown as TransactionMessage & { some: 1 };
        const newMessage = setTransactionMessageLifetimeUsingProvisoryBlockhash(message);
        newMessage satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime & { some: 1 };
    }
}

// [DESCRIBE] fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash
{
    // It sets the blockhash lifetime on the transaction message.
    {
        const message = null as unknown as TransactionMessage;
        const newMessage = fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash(message);
        newMessage satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
        // @ts-expect-error Should not be a durable nonce lifetime.
        newMessage satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
    }

    // It does not override existing lifetime constraints on the transaction message.
    {
        const message = null as unknown as TransactionMessage & TransactionMessageWithDurableNonceLifetime;
        const newMessage = fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash(message);
        newMessage satisfies TransactionMessage & TransactionMessageWithDurableNonceLifetime;
        // @ts-expect-error Should not be a blockhash lifetime.
        newMessage satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime;
    }

    // It keeps any extra properties on the transaction message.
    {
        const message = null as unknown as TransactionMessage & { some: 1 };
        const newMessage = fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash(message);
        newMessage satisfies TransactionMessage & TransactionMessageWithBlockhashLifetime & { some: 1 };
    }
}
