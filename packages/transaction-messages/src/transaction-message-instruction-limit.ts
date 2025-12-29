import type { NominalType } from '@solana/nominal-types';

import type { BaseTransactionMessage } from './transaction-message';

/**
 * The maximum number of instructions allowed in a transaction message.
 */
export const TRANSACTION_MESSAGE_INSTRUCTION_LIMIT = 64;

/**
 * A type guard that checks if a transaction message is within the instruction limit.
 */
export type TransactionMessageWithinInstructionLimit = NominalType<'transactionInstructionLimit', 'withinLimit'>;

/**
 * Helper type that removes the `TransactionMessageWithinInstructionLimit` flag
 * from a transaction message.
 */
export type ExcludeTransactionMessageWithinInstructionLimit<TTransactionMessage extends BaseTransactionMessage> = Omit<
    TTransactionMessage,
    '__transactionInstructionLimit:@solana/kit'
>;
