import { BaseTransactionMessage } from './transaction-message';

/**
 * A type guard that checks if a transaction message is within the size limit
 * when compiled into a transaction.
 */
export type TransactionMessageWithinSizeLimit = { readonly __within_size_limit: unique symbol };

/**
 * Helper type that removes the `TransactionMessageWithinSizeLimit` flag
 * from a transaction message.
 */
export type ExcludeTransactionMessageWithinSizeLimit<TTransactionMessage extends BaseTransactionMessage> = Omit<
    TTransactionMessage,
    '__within_size_limit'
>;
