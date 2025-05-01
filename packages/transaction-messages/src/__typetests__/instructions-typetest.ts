import { TransactionMessageWithBlockhashLifetime } from '../blockhash';
import { TransactionMessageWithDurableNonceLifetime } from '../durable-nonce';
import {
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    prependTransactionMessageInstruction,
    prependTransactionMessageInstructions,
} from '../instructions';
import { BaseTransactionMessage } from '../transaction-message';

type IInstruction = BaseTransactionMessage['instructions'][number];

// [DESCRIBE] appendTransactionMessageInstruction
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        const newMessage = appendTransactionMessageInstruction(null as unknown as IInstruction, message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
    }
}

// [DESCRIBE] appendTransactionMessageInstructions
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        const newMessage = appendTransactionMessageInstructions(null as unknown as IInstruction[], message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
    }
}

// [DESCRIBE] prependTransactionMessageInstruction
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        const newMessage = prependTransactionMessageInstruction(null as unknown as IInstruction, message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
    }

    // It strips the durable nonce transaction message type
    {
        const message = null as unknown as BaseTransactionMessage &
            TransactionMessageWithDurableNonceLifetime & { some: 1 };
        const newMessage = prependTransactionMessageInstruction(null as unknown as IInstruction, message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
        // @ts-expect-error The durable nonce transaction message type should be stripped.
        newMessage satisfies TransactionMessageWithDurableNonceLifetime;
    }

    // It does not remove blockhash lifetimes.
    {
        const message = null as unknown as BaseTransactionMessage &
            TransactionMessageWithBlockhashLifetime & { some: 1 };
        const newMessage = prependTransactionMessageInstruction(null as unknown as IInstruction, message);
        newMessage satisfies BaseTransactionMessage & TransactionMessageWithBlockhashLifetime & { some: 1 };
    }
}

// [DESCRIBE] prependTransactionMessageInstructions
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as BaseTransactionMessage & { some: 1 };
        const newMessage = prependTransactionMessageInstructions(null as unknown as IInstruction[], message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
    }

    // It strips the durable nonce transaction message type
    {
        const message = null as unknown as BaseTransactionMessage &
            TransactionMessageWithDurableNonceLifetime & { some: 1 };
        const newMessage = prependTransactionMessageInstructions(null as unknown as IInstruction[], message);
        newMessage satisfies BaseTransactionMessage & { some: 1 };
        // @ts-expect-error The durable nonce transaction message type should be stripped.
        newMessage satisfies TransactionMessageWithDurableNonceLifetime;
    }
}
