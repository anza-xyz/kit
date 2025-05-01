import { TransactionMessageWithBlockhashLifetime } from './blockhash';
import { TransactionMessageWithDurableNonceLifetime } from './durable-nonce';
import { BaseTransactionMessage } from './transaction-message';

/**
 * A transaction message with any valid lifetime constraint.
 */
export type TransactionMessageWithLifetime =
    | TransactionMessageWithBlockhashLifetime
    | TransactionMessageWithDurableNonceLifetime;

/**
 * A helper type to exclude any lifetime constraint from a transaction message.
 */
export type ExcludeTransactionMessageLifetime<TTransactionMessage extends BaseTransactionMessage> = Omit<
    TTransactionMessage,
    'lifetimeConstraint'
>;
