import type { Address } from '@solana/addresses';

import {
    assertIsTransactionMessageWithDurableNonceLifetime,
    isTransactionMessageWithDurableNonceLifetime,
    Nonce,
    setTransactionMessageLifetimeUsingDurableNonce,
    TransactionMessageWithDurableNonceLifetime,
} from '../durable-nonce';
import { AdvanceNonceAccountInstruction } from '../durable-nonce-instruction';
import { BaseTransactionMessage, TransactionMessage } from '../transaction-message';

const mockNonceConfig = {
    nonce: null as unknown as Nonce<'nonce'>,
    nonceAccountAddress: null as unknown as Address<'nonce'>,
    nonceAuthorityAddress: null as unknown as Address<'nonceAuthority'>,
};

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;

// [DESCRIBE] isTransactionMessageWithDurableNonceLifetime
{
    // It narrows the transaction message type to one with a nonce-based lifetime.
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        if (isTransactionMessageWithDurableNonceLifetime(message)) {
            message satisfies BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime & { some: 1 };
        } else {
            message satisfies BaseTransactionMessage & { some: 1 };
            // @ts-expect-error It does not have a nonce-based lifetime.
            message satisfies TransactionMessageWithDurableNonceLifetime;
        }
    }
}

// [DESCRIBE] assertIsTransactionMessageWithDurableNonceLifetime
{
    // It narrows the transaction message type to one with a nonce-based lifetime.
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        // @ts-expect-error Should not be durable nonce lifetime
        message satisfies TransactionMessageWithDurableNonceLifetime;
        // @ts-expect-error Should not have a nonce-based lifetime
        message satisfies { lifetimeConstraint: { nonce: Nonce } };
        // @ts-expect-error Should not start with a nonce instruction.
        message.instructions[0] satisfies AdvanceNonceAccountInstruction;
        assertIsTransactionMessageWithDurableNonceLifetime(message);
        message satisfies BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime & { some: 1 };
        message satisfies TransactionMessageWithDurableNonceLifetime;
        message satisfies { lifetimeConstraint: { nonce: Nonce } };
        message.instructions[0] satisfies AdvanceNonceAccountInstruction;
    }
}

// [DESCRIBE] setTransactionMessageLifetimeUsingDurableNonce
{
    // It sets the durable nonce lifetime on the transaction message for v0 messages.
    {
        const message = null as unknown as V0TransactionMessage & { some: 1 };
        const newMessage = setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, message);
        newMessage satisfies TransactionMessageWithDurableNonceLifetime & V0TransactionMessage & { some: 1 };
        // @ts-expect-error Should not be a legacy message.
        newMessage satisfies LegacyTransactionMessage & TransactionMessageWithDurableNonceLifetime & { some: 1 };
    }

    // It sets the durable nonce lifetime on the transaction message for legacy messages.
    {
        const message = null as unknown as LegacyTransactionMessage & { some: 1 };
        const newMessage = setTransactionMessageLifetimeUsingDurableNonce(mockNonceConfig, message);
        newMessage satisfies LegacyTransactionMessage & TransactionMessageWithDurableNonceLifetime & { some: 1 };
        // @ts-expect-error Should not be a v0 message.
        newMessage satisfies TransactionMessageWithDurableNonceLifetime & V0TransactionMessage & { some: 1 };
    }
}
