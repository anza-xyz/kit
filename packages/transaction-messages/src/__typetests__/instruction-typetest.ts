import { TransactionMessageWithDurableNonceLifetime } from '../durable-nonce';
import {
    appendTransactionMessageInstruction,
    appendTransactionMessageInstructions,
    prependTransactionMessageInstruction,
    prependTransactionMessageInstructions,
} from '../instructions';
import { BaseTransactionMessage } from '../transaction-message';

type MyTransactionMessage = BaseTransactionMessage & {};

type IInstruction = BaseTransactionMessage['instructions'][number];

// [DESCRIBE] appendTransactionMessageInstruction
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as MyTransactionMessage;
        const newMessage = appendTransactionMessageInstruction(null as unknown as IInstruction, message);
        newMessage satisfies MyTransactionMessage;
    }
}

// [DESCRIBE] appendTransactionMessageInstructions
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as MyTransactionMessage;
        const newMessage = appendTransactionMessageInstructions(null as unknown as IInstruction[], message);
        newMessage satisfies MyTransactionMessage;
    }
}

// [DESCRIBE] prependTransactionMessageInstruction
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as MyTransactionMessage;
        const newMessage = prependTransactionMessageInstruction(null as unknown as IInstruction, message);
        newMessage satisfies MyTransactionMessage;
    }

    // It strips the durable nonce transaction message type
    {
        const message = null as unknown as MyTransactionMessage & TransactionMessageWithDurableNonceLifetime;
        const newMessage = prependTransactionMessageInstruction(null as unknown as IInstruction, message);
        newMessage satisfies MyTransactionMessage;
        // @ts-expect-error The durable nonce transaction message type should be stripped.
        newMessage satisfies TransactionMessageWithDurableNonceLifetime;
    }
}

// [DESCRIBE] prependTransactionMessageInstructions
{
    // It returns the same TransactionMessage type
    {
        const message = null as unknown as MyTransactionMessage;
        const newMessage = prependTransactionMessageInstructions(null as unknown as IInstruction[], message);
        newMessage satisfies MyTransactionMessage;
    }

    // It strips the durable nonce transaction message type
    {
        const message = null as unknown as MyTransactionMessage & TransactionMessageWithDurableNonceLifetime;
        const newMessage = prependTransactionMessageInstructions(null as unknown as IInstruction[], message);
        newMessage satisfies MyTransactionMessage;
        // @ts-expect-error The durable nonce transaction message type should be stripped.
        newMessage satisfies TransactionMessageWithDurableNonceLifetime;
    }
}
