import { SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, SolanaError } from '@solana/errors';
import type {
    TransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionMessageWithinSizeLimit,
} from '@solana/transaction-messages';

import { compileTransaction } from './compile-transaction';
import { getTransactionSize } from './transaction-size';
import { LEGACY_TRANSACTION_SIZE_LIMIT, V1_TRANSACTION_SIZE_LIMIT } from './transaction-size-limits';

/**
 * Gets the compiled transaction size of a given transaction message in bytes.
 *
 * @example
 * ```ts
 * const transactionSize = getTransactionMessageSize(transactionMessage);
 * ```
 */
export function getTransactionMessageSize(
    transactionMessage: TransactionMessage & TransactionMessageWithFeePayer,
): number {
    return getTransactionSize(compileTransaction(transactionMessage));
}

/**
 * Returns the maximum allowed compiled size in bytes for a given transaction message.
 *
 * This depends on the version of the transaction message.
 *
 * @example
 * ```ts
 * const sizeLimit = getTransactionMessageSizeLimit(transactionMessage);
 * ```
 */
export function getTransactionMessageSizeLimit(
    transactionMessage: TransactionMessage & TransactionMessageWithFeePayer,
): number {
    return transactionMessage.version === 1 ? V1_TRANSACTION_SIZE_LIMIT : LEGACY_TRANSACTION_SIZE_LIMIT;
}

/**
 * Checks if a transaction message is within the size limit
 * when compiled into a transaction.
 *
 * @typeParam TTransactionMessage - The type of the given transaction message.
 *
 * @example
 * ```ts
 * if (isTransactionMessageWithinSizeLimit(transactionMessage)) {
 *    transactionMessage satisfies TransactionMessageWithinSizeLimit;
 * }
 * ```
 */
export function isTransactionMessageWithinSizeLimit<
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer,
>(
    transactionMessage: TTransactionMessage,
): transactionMessage is TransactionMessageWithinSizeLimit & TTransactionMessage {
    return getTransactionMessageSize(transactionMessage) <= getTransactionMessageSizeLimit(transactionMessage);
}

/**
 * Asserts that a given transaction message is within the size limit
 * when compiled into a transaction.
 *
 * Throws a {@link SolanaError} of code {@link SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT}
 * if the transaction message exceeds the size limit.
 *
 * @typeParam TTransactionMessage - The type of the given transaction message.
 *
 * @example
 * ```ts
 * assertIsTransactionMessageWithinSizeLimit(transactionMessage);
 * transactionMessage satisfies TransactionMessageWithinSizeLimit;
 * ```
 */
export function assertIsTransactionMessageWithinSizeLimit<
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer,
>(
    transactionMessage: TTransactionMessage,
): asserts transactionMessage is TransactionMessageWithinSizeLimit & TTransactionMessage {
    const transactionSize = getTransactionMessageSize(transactionMessage);
    const transactionSizeLimit = getTransactionMessageSizeLimit(transactionMessage);
    if (transactionSize > transactionSizeLimit) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, {
            transactionSize,
            transactionSizeLimit,
        });
    }
}
