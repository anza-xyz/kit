import { TransactionMessageWithDurableNonceLifetime } from './durable-nonce';
import { BaseTransactionMessage } from './transaction-message';

export function appendTransactionMessageInstruction<TTransactionMessage extends BaseTransactionMessage>(
    instruction: TTransactionMessage['instructions'][number],
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
    return appendTransactionMessageInstructions([instruction], transactionMessage);
}

export function appendTransactionMessageInstructions<TTransactionMessage extends BaseTransactionMessage>(
    instructions: ReadonlyArray<TTransactionMessage['instructions'][number]>,
    transactionMessage: TTransactionMessage,
): TTransactionMessage {
    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze([...transactionMessage.instructions, ...instructions]),
    });
}

// Durable nonce advance instruction must be the first instruction in the transaction message
// So if instructions are prepended, we strip the durable nonce transaction message type
type ExcludeDurableNonce<T> = T extends TransactionMessageWithDurableNonceLifetime
    ? BaseTransactionMessage & Omit<T, keyof TransactionMessageWithDurableNonceLifetime>
    : T;

export function prependTransactionMessageInstruction<TTransactionMessage extends BaseTransactionMessage>(
    instruction: TTransactionMessage['instructions'][number],
    transactionMessage: TTransactionMessage,
): ExcludeDurableNonce<TTransactionMessage> {
    return prependTransactionMessageInstructions([instruction], transactionMessage);
}

export function prependTransactionMessageInstructions<TTransactionMessage extends BaseTransactionMessage>(
    instructions: ReadonlyArray<TTransactionMessage['instructions'][number]>,
    transactionMessage: TTransactionMessage,
): ExcludeDurableNonce<TTransactionMessage> {
    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze([...instructions, ...transactionMessage.instructions]),
    }) as ExcludeDurableNonce<TTransactionMessage>;
}
