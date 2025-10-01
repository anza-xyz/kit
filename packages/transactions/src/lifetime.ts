import { type Address, isAddress } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME,
    SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME,
    SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE,
    SolanaError,
} from '@solana/errors';
import { type Blockhash, isBlockhash, type Slot } from '@solana/rpc-types';
import type {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    Nonce,
    TransactionMessage,
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
 * Helper type that sets the lifetime constraint of a transaction to be the same as the
 * lifetime constraint of the provided transaction message.
 *
 * If the transaction message has no explicit lifetime constraint, neither will the transaction.
 */
export type SetTransactionLifetimeFromTransactionMessage<
    TTransaction extends Transaction,
    TTransactionMessage extends TransactionMessage,
> = TTransactionMessage extends { lifetimeConstraint: unknown }
    ? TTransactionMessage['lifetimeConstraint'] extends TransactionMessageWithBlockhashLifetime['lifetimeConstraint']
        ? TransactionWithBlockhashLifetime & TTransaction
        : TTransactionMessage['lifetimeConstraint'] extends TransactionMessageWithDurableNonceLifetime['lifetimeConstraint']
          ? TransactionWithDurableNonceLifetime & TTransaction
          : TransactionWithLifetime & TTransaction
    : TTransaction;

const SYSTEM_PROGRAM_ADDRESS = '11111111111111111111111111111111' as Address;

function compiledInstructionIsAdvanceNonceInstruction(
    instruction: CompiledTransactionMessage['instructions'][number],
    staticAddresses: Address[],
): instruction is typeof instruction & { accountIndices: [number, number, number] } {
    return (
        staticAddresses[instruction.programAddressIndex] === SYSTEM_PROGRAM_ADDRESS &&
        // Test for `AdvanceNonceAccount` instruction data
        instruction.data != null &&
        isAdvanceNonceAccountInstructionData(instruction.data) &&
        // Test for exactly 3 accounts
        instruction.accountIndices?.length === 3
    );
}

function isAdvanceNonceAccountInstructionData(data: ReadonlyUint8Array): boolean {
    // AdvanceNonceAccount is the fifth instruction in the System Program (index 4)
    return data.byteLength === 4 && data[0] === 4 && data[1] === 0 && data[2] === 0 && data[3] === 0;
}

/**
 * Get the lifetime constraint for a transaction from a compiled transaction message that includes a lifetime token.
 * @param compiledTransactionMessage A compiled transaction message that includes a lifetime token
 * @returns A lifetime constraint for the transaction
 * Note that this is less precise than checking a decompiled instruction, as we can't inspect
 * the address or role of input accounts (which may be in lookup tables). However, this is
 * sufficient for all valid advance durable nonce instructions.
 * Note that the program address must not be in a lookup table, see [this answer on StackExchange](https://solana.stackexchange.com/a/16224/289)
 * @see {@link isAdvanceNonceAccountInstruction}
 * Note that this function is async to allow for future implementations that may fetch `lastValidBlockHeight` using an RPC
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function getTransactionLifetimeConstraintFromCompiledTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime,
): Promise<TransactionBlockhashLifetime | TransactionDurableNonceLifetime> {
    const firstInstruction = compiledTransactionMessage.instructions[0];
    const { staticAccounts } = compiledTransactionMessage;

    // We need to check if the first instruction is an AdvanceNonceAccount instruction
    if (firstInstruction && compiledInstructionIsAdvanceNonceInstruction(firstInstruction, staticAccounts)) {
        const nonceAccountAddress = staticAccounts[firstInstruction.accountIndices[0]];
        if (!nonceAccountAddress) {
            throw new SolanaError(SOLANA_ERROR__TRANSACTION__NONCE_ACCOUNT_CANNOT_BE_IN_LOOKUP_TABLE, {
                nonce: compiledTransactionMessage.lifetimeToken,
            });
        }
        return {
            nonce: compiledTransactionMessage.lifetimeToken as Nonce,
            nonceAccountAddress,
        };
    } else {
        return {
            blockhash: compiledTransactionMessage.lifetimeToken as Blockhash,
            // This is not known from the compiled message, so we set it to the maximum possible value
            lastValidBlockHeight: 0xffffffffffffffffn,
        };
    }
}

/**
 * A type guard that returns `true` if the transaction conforms to the
 * {@link TransactionWithBlockhashLifetime} type, and refines its type for use in your
 * program.
 *
 * @example
 * ```ts
 * import { isTransactionWithBlockhashLifetime } from '@solana/transactions';
 *
 * if (isTransactionWithBlockhashLifetime(transaction)) {
 *     // At this point, `transaction` has been refined to a `TransactionWithBlockhashLifetime`.
 *     const { blockhash } = transaction.lifetimeConstraint;
 *     const { value: blockhashIsValid } = await rpc.isBlockhashValid(blockhash).send();
 *     setBlockhashIsValid(blockhashIsValid);
 * } else {
 *     setError(
 *         `${getSignatureFromTransaction(transaction)} does not have a blockhash-based lifetime`,
 *     );
 * }
 * ```
 */
export function isTransactionWithBlockhashLifetime(
    transaction: Transaction | (Transaction & TransactionWithLifetime),
): transaction is Transaction & TransactionWithBlockhashLifetime {
    return (
        'lifetimeConstraint' in transaction &&
        'blockhash' in transaction.lifetimeConstraint &&
        typeof transaction.lifetimeConstraint.blockhash === 'string' &&
        typeof transaction.lifetimeConstraint.lastValidBlockHeight === 'bigint' &&
        isBlockhash(transaction.lifetimeConstraint.blockhash)
    );
}

/**
 * From time to time you might acquire a transaction, that you expect to have a
 * blockhash-based lifetime, from for example a wallet. Use this function to
 * assert that such a transaction actually has a blockhash-based lifetime.
 *
 * @example
 * ```ts
 * import { assertIsTransactionWithBlockhashLifetime } from '@solana/transactions';
 *
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `transaction` to `TransactionWithBlockhashLifetime`.
 *     assertIsTransactionWithBlockhashLifetime(transaction);
 *     // At this point, `transaction` is a `TransactionWithBlockhashLifetime` that can be used
 *     // with the RPC.
 *     const { blockhash } = transaction.lifetimeConstraint;
 *     const { value: blockhashIsValid } = await rpc.isBlockhashValid(blockhash).send();
 * } catch (e) {
 *     // `transaction` turned out not to have a blockhash-based lifetime
 * }
 * ```
 */
export function assertIsTransactionWithBlockhashLifetime(
    transaction: Transaction | (Transaction & TransactionWithLifetime),
): asserts transaction is Transaction & TransactionWithBlockhashLifetime {
    if (!isTransactionWithBlockhashLifetime(transaction)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXPECTED_BLOCKHASH_LIFETIME);
    }
}

/**
 * A type guard that returns `true` if the transaction conforms to the
 * {@link TransactionWithDurableNonceLifetime} type, and refines its type for use in your
 * program.
 *
 * @example
 * ```ts
 * import { isTransactionWithDurableNonceLifetime } from '@solana/transactions';
 * import { fetchNonce } from "@solana-program/system";
 *
 * if (isTransactionWithDurableNonceLifetime(transaction)) {
 *     // At this point, `transaction` has been refined to a
 *     // `TransactionWithDurableNonceLifetime`.
 *     const { nonce, nonceAccountAddress } = transaction.lifetimeConstraint;
 *     const { data: { blockhash: actualNonce } } = await fetchNonce(nonceAccountAddress);
 *     setNonceIsValid(nonce === actualNonce);
 * } else {
 *     setError(
 *         `${getSignatureFromTransaction(transaction)} does not have a nonce-based lifetime`,
 *     );
 * }
 * ```
 */
export function isTransactionWithDurableNonceLifetime(
    transaction: Transaction | (Transaction & TransactionWithLifetime),
): transaction is Transaction & TransactionWithDurableNonceLifetime {
    return (
        'lifetimeConstraint' in transaction &&
        'nonce' in transaction.lifetimeConstraint &&
        typeof transaction.lifetimeConstraint.nonce === 'string' &&
        typeof transaction.lifetimeConstraint.nonceAccountAddress === 'string' &&
        isAddress(transaction.lifetimeConstraint.nonceAccountAddress)
    );
}

/**
 * From time to time you might acquire a transaction, that you expect to have a
 * nonce-based lifetime, from for example a wallet. Use this function to assert
 * that such a transaction actually has a nonce-based lifetime.
 *
 * @example
 * ```ts
 * import { assertIsTransactionWithDurableNonceLifetime } from '@solana/transactions';
 *
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `transaction` to `TransactionWithDurableNonceLifetime`.
 *     assertIsTransactionWithDurableNonceLifetime(transaction);
 *     // At this point, `transaction` is a `TransactionWithDurableNonceLifetime` that can be used
 *     // with the RPC.
 *     const { nonce, nonceAccountAddress } = transaction.lifetimeConstraint;
 *     const { data: { blockhash: actualNonce } } = await fetchNonce(nonceAccountAddress);
 * } catch (e) {
 *     // `transaction` turned out not to have a nonce-based lifetime
 * }
 * ```
 */
export function assertIsTransactionWithDurableNonceLifetime(
    transaction: Transaction | (Transaction & TransactionWithLifetime),
): asserts transaction is Transaction & TransactionWithDurableNonceLifetime {
    if (!isTransactionWithDurableNonceLifetime(transaction)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME);
    }
}
