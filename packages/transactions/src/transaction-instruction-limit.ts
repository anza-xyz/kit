import { SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, SolanaError } from '@solana/errors';
import type { NominalType } from '@solana/nominal-types';
import {
    type BaseTransactionMessage,
    getCompiledTransactionMessageDecoder,
    TRANSACTION_MESSAGE_INSTRUCTION_LIMIT,
    type TransactionMessageWithinInstructionLimit,
} from '@solana/transaction-messages';

import type { Transaction } from './transaction';

/**
 * A type guard that checks if a transaction is within the instruction limit.
 */
export type TransactionWithinInstructionLimit = NominalType<'transactionInstructionLimit', 'withinLimit'>;

/**
 * Helper type that adds the `TransactionWithinInstructionLimit` flag to
 * a transaction if and only if the provided transaction message
 * is also within the instruction limit.
 */
export type SetTransactionWithinInstructionLimitFromTransactionMessage<
    TTransaction extends Transaction,
    TTransactionMessage extends BaseTransactionMessage,
> = TTransactionMessage extends TransactionMessageWithinInstructionLimit
    ? TransactionWithinInstructionLimit & TTransaction
    : TTransaction;

/**
 * Gets the number of instructions in a compiled transaction.
 *
 * @example
 * ```ts
 * const instructionCount = getTransactionInstructionCount(transaction);
 * ```
 */
export function getTransactionInstructionCount(transaction: Transaction): number {
    return getCompiledTransactionMessageDecoder().decode(transaction.messageBytes).instructions.length;
}

/**
 * Checks if a transaction is within the instruction limit.
 *
 * @typeParam TTransaction - The type of the given transaction.
 *
 * @example
 * ```ts
 * if (isTransactionWithinInstructionLimit(transaction)) {
 *    transaction satisfies TransactionWithinInstructionLimit;
 * }
 * ```
 */
export function isTransactionWithinInstructionLimit<TTransaction extends Transaction>(
    transaction: TTransaction,
): transaction is TransactionWithinInstructionLimit & TTransaction {
    return getTransactionInstructionCount(transaction) <= TRANSACTION_MESSAGE_INSTRUCTION_LIMIT;
}

/**
 * Asserts that a given transaction is within the instruction limit.
 *
 * Throws a {@link SolanaError} of code {@link SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT}
 * if the transaction exceeds the instruction limit.
 *
 * @typeParam TTransaction - The type of the given transaction.
 *
 * @example
 * ```ts
 * assertIsTransactionWithinInstructionLimit(transaction);
 * transaction satisfies TransactionWithinInstructionLimit;
 * ```
 */
export function assertIsTransactionWithinInstructionLimit<TTransaction extends Transaction>(
    transaction: TTransaction,
): asserts transaction is TransactionWithinInstructionLimit & TTransaction {
    const instructionCount = getTransactionInstructionCount(transaction);
    if (instructionCount > TRANSACTION_MESSAGE_INSTRUCTION_LIMIT) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_INSTRUCTION_LIMIT, {
            instructionCount,
            instructionLimit: TRANSACTION_MESSAGE_INSTRUCTION_LIMIT,
        });
    }
}
