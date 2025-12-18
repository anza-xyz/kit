import { TransactionMessageWithBlockhashLifetime } from './blockhash';
import { TransactionMessageWithDurableNonceLifetime } from './durable-nonce';
import { TransactionMessage } from './transaction-message';

/**
 * A transaction message with any valid lifetime constraint.
 */
export type TransactionMessageWithLifetime =
    | TransactionMessageWithBlockhashLifetime
    | TransactionMessageWithDurableNonceLifetime;

/**
 * A helper type to exclude any lifetime constraint from a transaction message.
 */
export type ExcludeTransactionMessageLifetime<TTransactionMessage extends TransactionMessage> =
    TTransactionMessage extends unknown ? Omit<TTransactionMessage, 'lifetimeConstraint'> : never;
