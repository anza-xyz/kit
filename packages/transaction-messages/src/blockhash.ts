import { SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME, SolanaError } from '@solana/errors';
import { assertIsBlockhash, type Blockhash } from '@solana/rpc-types';

import { TransactionMessageWithDurableNonceLifetime } from './durable-nonce';
import { BaseTransactionMessage } from './transaction-message';

/**
 * A constraint which, when applied to a transaction message, makes that transaction message
 * eligible to land on the network. The transaction message will continue to be eligible to land
 * until the network considers the `blockhash` to be expired.
 *
 * This can happen when the network proceeds past the `lastValidBlockHeight` for which the blockhash
 * is considered valid, or when the network switches to a fork where that blockhash is not present.
 */
type BlockhashLifetimeConstraint = Readonly<{
    /**
     * A recent blockhash observed by the transaction proposer.
     *
     * The transaction message will be considered eligible to land until the network determines this
     * blockhash to be too old, or has switched to a fork where it is not present.
     */
    blockhash: Blockhash;
    /**
     * This is the block height beyond which the network will consider the blockhash to be too old
     * to make a transaction message eligible to land.
     */
    lastValidBlockHeight: bigint;
}>;

/**
 * Represents a transaction message whose lifetime is defined by the age of the blockhash it
 * includes.
 *
 * Such a transaction can only be landed on the network if the current block height of the network
 * is less than or equal to the value of
 * `TransactionMessageWithBlockhashLifetime['lifetimeConstraint']['lastValidBlockHeight']`.
 */
export interface TransactionMessageWithBlockhashLifetime {
    readonly lifetimeConstraint: BlockhashLifetimeConstraint;
}

/**
 * A type guard that returns `true` if the transaction message conforms to the
 * {@link TransactionMessageWithBlockhashLifetime} type, and refines its type for use in your
 * program.
 *
 * @example
 * ```ts
 * import { isTransactionMessageWithBlockhashLifetime } from '@solana/transaction-messages';
 *
 * if (isTransactionMessageWithBlockhashLifetime(message)) {
 *     // At this point, `message` has been refined to a `TransactionMessageWithBlockhashLifetime`.
 *     const { blockhash } = message.lifetimeConstraint;
 *     const { value: blockhashIsValid } = await rpc.isBlockhashValid(blockhash).send();
 *     setBlockhashIsValid(blockhashIsValid);
 * } else {
 *     setError(
 *         `${getSignatureFromTransaction(transaction)} does not have a blockhash-based lifetime`,
 *     );
 * }
 * ```
 */
export function isTransactionMessageWithBlockhashLifetime(
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
): transactionMessage is BaseTransactionMessage & TransactionMessageWithBlockhashLifetime {
    const lifetimeConstraintShapeMatches =
        'lifetimeConstraint' in transactionMessage &&
        typeof transactionMessage.lifetimeConstraint.blockhash === 'string' &&
        typeof transactionMessage.lifetimeConstraint.lastValidBlockHeight === 'bigint';
    if (!lifetimeConstraintShapeMatches) return false;
    try {
        assertIsBlockhash(transactionMessage.lifetimeConstraint.blockhash);
        return true;
    } catch {
        return false;
    }
}

/**
 * From time to time you might acquire a transaction message, that you expect to have a
 * blockhash-based lifetime, from an untrusted network API or user input. Use this function to
 * assert that such a transaction message actually has a blockhash-based lifetime.
 *
 * @example
 * ```ts
 * import { assertIsTransactionMessageWithBlockhashLifetime } from '@solana/transaction-messages';
 *
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `message` to `TransactionMessageWithBlockhashLifetime`.
 *     assertIsTransactionMessageWithBlockhashLifetime(message);
 *     // At this point, `message` is a `TransactionMessageWithBlockhashLifetime` that can be used
 *     // with the RPC.
 *     const { blockhash } = message.lifetimeConstraint;
 *     const { value: blockhashIsValid } = await rpc.isBlockhashValid(blockhash).send();
 * } catch (e) {
 *     // `message` turned out not to have a blockhash-based lifetime
 * }
 * ```
 */
export function assertIsTransactionMessageWithBlockhashLifetime(
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
): asserts transactionMessage is BaseTransactionMessage & TransactionMessageWithBlockhashLifetime {
    if (!isTransactionMessageWithBlockhashLifetime(transactionMessage)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME);
    }
}

/**
 * Given a blockhash and the last block height at which that blockhash is considered usable to land
 * transactions, this method will return a new transaction message having the same type as the one
 * supplied plus the `TransactionMessageWithBlockhashLifetime` type.
 *
 * @example
 * ```ts
 * import { setTransactionMessageLifetimeUsingBlockhash } from '@solana/transaction-messages';
 *
 * const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
 * const txMessageWithBlockhashLifetime = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, txMessage);
 * ```
 */
export function setTransactionMessageLifetimeUsingBlockhash<
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime,
>(
    blockhashLifetimeConstraint: BlockhashLifetimeConstraint,
    transactionMessage: TTransactionMessage,
): Omit<TTransactionMessage, 'lifetimeConstraint'> & TransactionMessageWithBlockhashLifetime;

export function setTransactionMessageLifetimeUsingBlockhash<
    TTransactionMessage extends
        | BaseTransactionMessage
        | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
>(
    blockhashLifetimeConstraint: BlockhashLifetimeConstraint,
    transactionMessage: TTransactionMessage,
): TransactionMessageWithBlockhashLifetime & TTransactionMessage;

export function setTransactionMessageLifetimeUsingBlockhash(
    blockhashLifetimeConstraint: BlockhashLifetimeConstraint,
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithBlockhashLifetime),
) {
    if (
        'lifetimeConstraint' in transactionMessage &&
        transactionMessage.lifetimeConstraint.blockhash === blockhashLifetimeConstraint.blockhash &&
        transactionMessage.lifetimeConstraint.lastValidBlockHeight === blockhashLifetimeConstraint.lastValidBlockHeight
    ) {
        return transactionMessage;
    }
    const out = {
        ...transactionMessage,
        lifetimeConstraint: Object.freeze(blockhashLifetimeConstraint),
    };
    Object.freeze(out);
    return out;
}
