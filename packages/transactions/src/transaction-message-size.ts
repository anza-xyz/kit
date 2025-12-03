import { SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, SolanaError } from '@solana/errors';
import type {
    BaseTransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionMessageWithinSizeLimit,
} from '@solana/transaction-messages';

import { compileTransaction } from './compile-transaction';
import { getTransactionSize, TRANSACTION_SIZE_LIMIT } from './transaction-size';

/**
 * Gets the compiled transaction size of a given transaction message in bytes.
 *
 * @example
 * ```ts
 * const transactionSize = getTransactionMessageSize(transactionMessage);
 * ```
 */
export function getTransactionMessageSize(
    transactionMessage: BaseTransactionMessage & TransactionMessageWithFeePayer,
): number {
    return getTransactionSize(compileTransaction(transactionMessage));
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
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer,
>(
    transactionMessage: TTransactionMessage,
): transactionMessage is TransactionMessageWithinSizeLimit & TTransactionMessage {
    return getTransactionMessageSize(transactionMessage) <= TRANSACTION_SIZE_LIMIT;
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
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer,
>(
    transactionMessage: TTransactionMessage,
): asserts transactionMessage is TransactionMessageWithinSizeLimit & TTransactionMessage {
    const transactionSize = getTransactionMessageSize(transactionMessage);
    if (transactionSize > TRANSACTION_SIZE_LIMIT) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXCEEDS_SIZE_LIMIT, {
            transactionSize,
            transactionSizeLimit: TRANSACTION_SIZE_LIMIT,
        });
    }
}
