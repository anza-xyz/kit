import { SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, SolanaError } from '@solana/errors';
import type { BaseTransactionMessage, TransactionMessageWithinInstructionLimit } from '@solana/transaction-messages';
import { TRANSACTION_MESSAGE_INSTRUCTION_LIMIT } from '@solana/transaction-messages';

/**
 * Gets the number of instructions in a transaction message.
 *
 * @example
 * ```ts
 * const instructionCount = getTransactionMessageInstructionCount(transactionMessage);
 * ```
 */
export function getTransactionMessageInstructionCount(transactionMessage: BaseTransactionMessage): number {
    return transactionMessage.instructions.length;
}

/**
 * Checks if a transaction message is within the instruction limit.
 *
 * @typeParam TTransactionMessage - The type of the given transaction message.
 *
 * @example
 * ```ts
 * if (isTransactionMessageWithinInstructionLimit(transactionMessage)) {
 *    transactionMessage satisfies TransactionMessageWithinInstructionLimit;
 * }
 * ```
 */
export function isTransactionMessageWithinInstructionLimit<TTransactionMessage extends BaseTransactionMessage>(
    transactionMessage: TTransactionMessage,
): transactionMessage is TransactionMessageWithinInstructionLimit & TTransactionMessage {
    return getTransactionMessageInstructionCount(transactionMessage) <= TRANSACTION_MESSAGE_INSTRUCTION_LIMIT;
}

/**
 * Asserts that a given transaction message is within the instruction limit.
 *
 * Throws a {@link SolanaError} of code {@link SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT}
 * if the transaction message exceeds the instruction limit.
 *
 * @typeParam TTransactionMessage - The type of the given transaction message.
 *
 * @example
 * ```ts
 * assertIsTransactionMessageWithinInstructionLimit(transactionMessage);
 * transactionMessage satisfies TransactionMessageWithinInstructionLimit;
 * ```
 */
export function assertIsTransactionMessageWithinInstructionLimit<TTransactionMessage extends BaseTransactionMessage>(
    transactionMessage: TTransactionMessage,
): asserts transactionMessage is TransactionMessageWithinInstructionLimit & TTransactionMessage {
    const instructionCount = getTransactionMessageInstructionCount(transactionMessage);
    if (instructionCount > TRANSACTION_MESSAGE_INSTRUCTION_LIMIT) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, {
            instructionCount,
            instructionLimit: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT,
        });
    }
}
