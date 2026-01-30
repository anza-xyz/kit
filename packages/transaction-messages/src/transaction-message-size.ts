import type { NominalType } from '@solana/nominal-types';

import type { TransactionMessage } from './transaction-message';

/**
 * A type guard that checks if a transaction message is within the size limit
 * when compiled into a transaction.
 */
export type TransactionMessageWithinSizeLimit = NominalType<'transactionSize', 'withinLimit'>;

/**
 * Helper type that removes the `TransactionMessageWithinSizeLimit` flag
 * from a transaction message.
 */
export type ExcludeTransactionMessageWithinSizeLimit<TTransactionMessage extends TransactionMessage> = Omit<
    TTransactionMessage,
    '__transactionSize:@solana/kit'
>;
