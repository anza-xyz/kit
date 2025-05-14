import type { Address } from '@solana/addresses';
import type { Blockhash, Slot } from '@solana/rpc-types';
import type {
    CompilableTransactionMessage,
    Nonce,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithDurableNonceLifetime,
} from '@solana/transaction-messages';

import type { Transaction } from './transaction';

/**
 * A constraint which, when applied to a transaction, makes that transaction eligible to land on the
 * network. The transaction will continue to be eligible to land until the network considers the
 * `blockhash` to be expired.
 *
 * This can happen when the network proceeds past the `lastValidBlockHeight` for which the blockhash
 * is considered valid, or when the network switches to a fork where that blockhash is not present.
 */
export type TransactionBlockhashLifetime = {
    /**
     * A recent blockhash observed by the transaction proposer.
     *
     * The transaction will be considered eligible to land until the network determines this
     * blockhash to be too old, or has switched to a fork where it is not present.
     */
    blockhash: Blockhash;
    /**
     * This is the block height beyond which the network will consider the blockhash to be too old
     * to make a transaction eligible to land.
     */
    lastValidBlockHeight: Slot;
};

/**
 * A constraint which, when applied to a transaction, makes that transaction eligible to land on the
 * network.
 *
 * The transaction will continue to be eligible to land until the network considers the `nonce` to
 * have advanced. This can happen when the nonce account in which this nonce is found is destroyed,
 * or the nonce value within changes.
 */
export type TransactionDurableNonceLifetime = {
    /**
     * A value contained in the account with address `nonceAccountAddress` at the time the
     * transaction was prepared.
     *
     * The transaction will be considered eligible to land until the nonce account ceases to exist
     * or contain this value.
     */
    nonce: Nonce;
    /** The account that contains the `nonce` value */
    nonceAccountAddress: Address;
};

/**
 * A transaction whose ability to land on the network is determined by some evanescent criteria.
 *
 * This describes a window of time after which a transaction is constructed and before which it will
 * no longer be accepted by the network.
 *
 * No transaction can land on Solana without having a `lifetimeConstraint` set.
 */
export type TransactionWithLifetime = {
    readonly lifetimeConstraint: TransactionBlockhashLifetime | TransactionDurableNonceLifetime;
};

/**
 * A transaction whose lifetime is determined by the age of a blockhash observed on the network.
 *
 * The transaction will continue to be eligible to land until the network considers the `blockhash`
 * to be expired.
 */
export type TransactionWithBlockhashLifetime = {
    readonly lifetimeConstraint: TransactionBlockhashLifetime;
};

/**
 * A transaction whose lifetime is determined by a nonce.
 *
 * The transaction will continue to be eligible to land until the network considers the `nonce` to
 * have advanced. This can happen when the nonce account in which this nonce is found is destroyed,
 * or the nonce value within changes.
 */
export type TransactionWithDurableNonceLifetime = {
    readonly lifetimeConstraint: TransactionDurableNonceLifetime;
};

/**
 * Helper type that sets the lifetime constraint of a transaction message to be the same as the
 * lifetime constraint of the provided transaction message.
 */
export type SetTransactionLifetimeFromCompilableTransactionMessage<
    TTransaction extends Transaction,
    TTransactionMessage extends CompilableTransactionMessage,
> =
    // Note that we have to compare the `lifetimeConstraint` properties explicitly because the
    // `CompilableTransactionMessage` contains the union of all possible lifetime constraints
    // and therefore would always match the first condition.
    TTransactionMessage['lifetimeConstraint'] extends TransactionMessageWithBlockhashLifetime['lifetimeConstraint']
        ? TransactionWithBlockhashLifetime & TTransaction
        : TTransactionMessage['lifetimeConstraint'] extends TransactionMessageWithDurableNonceLifetime['lifetimeConstraint']
          ? TransactionWithDurableNonceLifetime & TTransaction
          : TransactionWithLifetime & TTransaction;
