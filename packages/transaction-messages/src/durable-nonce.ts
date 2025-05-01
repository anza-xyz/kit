import { Address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME, SolanaError } from '@solana/errors';
import { IInstruction } from '@solana/instructions';
import { Brand } from '@solana/nominal-types';

import {
    AdvanceNonceAccountInstruction,
    createAdvanceNonceAccountInstruction,
    isAdvanceNonceAccountInstruction,
} from './durable-nonce-instruction';
import { ExcludeTransactionMessageLifetime } from './lifetime';
import { BaseTransactionMessage } from './transaction-message';

type DurableNonceConfig<
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
    TNonceValue extends string = string,
> = Readonly<{
    readonly nonce: Nonce<TNonceValue>;
    readonly nonceAccountAddress: Address<TNonceAccountAddress>;
    readonly nonceAuthorityAddress: Address<TNonceAuthorityAddress>;
}>;

/** Represents a string that is particularly known to be the base58-encoded value of a nonce. */
export type Nonce<TNonceValue extends string = string> = Brand<TNonceValue, 'Nonce'>;

/**
 * A constraint which, when applied to a transaction message, makes that transaction message
 * eligible to land on the network.
 *
 * The transaction message will continue to be eligible to land until the network considers the
 * `nonce` to have advanced. This can happen when the nonce account in which this nonce is found is
 * destroyed, or the nonce value within changes.
 */
type NonceLifetimeConstraint<TNonceValue extends string = string> = Readonly<{
    /**
     * A value contained in the related nonce account at the time the transaction was prepared.
     *
     * The transaction will be considered eligible to land until the nonce account ceases to exist
     * or contain this value.
     */
    nonce: Nonce<TNonceValue>;
}>;

/**
 * Represents a transaction message whose lifetime is defined by the value of a nonce it includes.
 *
 * Such a transaction can only be landed on the network if the nonce is known to the network and has
 * not already been used to land a different transaction.
 */
export interface TransactionMessageWithDurableNonceLifetime<
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
    TNonceValue extends string = string,
> {
    readonly instructions: readonly [
        // The first instruction *must* be the system program's `AdvanceNonceAccount` instruction.
        AdvanceNonceAccountInstruction<TNonceAccountAddress, TNonceAuthorityAddress>,
        ...IInstruction[],
    ];
    readonly lifetimeConstraint: NonceLifetimeConstraint<TNonceValue>;
}

/**
 * A helper type to exclude the durable nonce lifetime constraint from a transaction message.
 */
export type ExcludeTransactionMessageDurableNonceLifetime<TTransactionMessage extends BaseTransactionMessage> =
    TTransactionMessage extends TransactionMessageWithDurableNonceLifetime
        ? ExcludeTransactionMessageLifetime<TTransactionMessage>
        : TTransactionMessage;

/**
 * A type guard that returns `true` if the transaction message conforms to the
 * {@link TransactionMessageWithDurableNonceLifetime} type, and refines its type for use in your
 * program.
 *
 * @example
 * ```ts
 * import { isTransactionMessageWithDurableNonceLifetime } from '@solana/transaction-messages';
 * import { fetchNonce } from "@solana-program/system";
 *
 * if (isTransactionMessageWithDurableNonceLifetime(message)) {
 *     // At this point, `message` has been refined to a
 *     // `TransactionMessageWithDurableNonceLifetime`.
 *     const { nonce, nonceAccountAddress } = message.lifetimeConstraint;
 *     const { data: { blockhash: actualNonce } } = await fetchNonce(nonceAccountAddress);
 *     setNonceIsValid(nonce === actualNonce);
 * } else {
 *     setError(
 *         `${getSignatureFromTransaction(transaction)} does not have a nonce-based lifetime`,
 *     );
 * }
 * ```
 */
export function isTransactionMessageWithDurableNonceLifetime(
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime),
): transactionMessage is BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime {
    return (
        'lifetimeConstraint' in transactionMessage &&
        typeof transactionMessage.lifetimeConstraint.nonce === 'string' &&
        transactionMessage.instructions[0] != null &&
        isAdvanceNonceAccountInstruction(transactionMessage.instructions[0])
    );
}

/**
 * From time to time you might acquire a transaction message, that you expect to have a
 * nonce-based lifetime, from an untrusted network API or user input. Use this function to assert
 * that such a transaction message actually has a nonce-based lifetime.
 *
 * @example
 * ```ts
 * import { assertIsDurableNonceTransactionMessage } from '@solana/transaction-messages';
 *
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `message` to `TransactionMessageWithDurableNonceLifetime`.
 *     assertIsDurableNonceTransactionMessage(message);
 *     // At this point, `message` is a `TransactionMessageWithDurableNonceLifetime` that can be used
 *     // with the RPC.
 *     const { nonce, nonceAccountAddress } = message.lifetimeConstraint;
 *     const { data: { blockhash: actualNonce } } = await fetchNonce(nonceAccountAddress);
 * } catch (e) {
 *     // `message` turned out not to have a nonce-based lifetime
 * }
 * ```
 */
export function assertIsTransactionMessageWithDurableNonceLifetime(
    transactionMessage: BaseTransactionMessage | (BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime),
): asserts transactionMessage is BaseTransactionMessage & TransactionMessageWithDurableNonceLifetime {
    if (!isTransactionMessageWithDurableNonceLifetime(transactionMessage)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__EXPECTED_NONCE_LIFETIME);
    }
}

function isAdvanceNonceAccountInstructionForNonce<
    TNonceAccountAddress extends Address = Address,
    TNonceAuthorityAddress extends Address = Address,
>(
    instruction: AdvanceNonceAccountInstruction,
    nonceAccountAddress: TNonceAccountAddress,
    nonceAuthorityAddress: TNonceAuthorityAddress,
): instruction is AdvanceNonceAccountInstruction<TNonceAccountAddress, TNonceAuthorityAddress> {
    return (
        instruction.accounts[0].address === nonceAccountAddress &&
        instruction.accounts[2].address === nonceAuthorityAddress
    );
}

/**
 * Given a nonce, the account where the value of the nonce is stored, and the address of the account
 * authorized to consume that nonce, this method will return a new transaction having the same type
 * as the one supplied plus the {@link TransactionMessageWithDurableNonceLifetime} type.
 *
 * In particular, this method _prepends_ an instruction to the transaction message designed to
 * consume (or 'advance') the nonce in the same transaction whose lifetime is defined by it.
 *
 * @param config
 *
 * @example
 * ```ts
 * import { setTransactionMessageLifetimeUsingDurableNonce } from '@solana/transactions';
 *
 * const NONCE_VALUE_OFFSET =
 *     4 + // version(u32)
 *     4 + // state(u32)
 *     32; // nonce authority(pubkey)
 * // Then comes the nonce value.
 *
 * const nonceAccountAddress = address('EGtMh4yvXswwHhwVhyPxGrVV2TkLTgUqGodbATEPvojZ');
 * const nonceAuthorityAddress = address('4KD1Rdrd89NG7XbzW3xsX9Aqnx2EExJvExiNme6g9iAT');
 * const { value: nonceAccount } = await rpc
 *     .getAccountInfo(nonceAccountAddress, {
 *         dataSlice: { length: 32, offset: NONCE_VALUE_OFFSET },
 *         encoding: 'base58',
 *     })
 *     .send();
 * const nonce =
 *     // This works because we asked for the exact slice of data representing the nonce
 *     // value, and furthermore asked for it in `base58` encoding.
 *     nonceAccount!.data[0] as unknown as Nonce;
 *
 * const durableNonceTransactionMessage = setTransactionMessageLifetimeUsingDurableNonce(
 *     { nonce, nonceAccountAddress, nonceAuthorityAddress },
 *     tx,
 * );
 * ```
 */
export function setTransactionMessageLifetimeUsingDurableNonce<
    TTransactionMessage extends BaseTransactionMessage,
    TNonceAccountAddress extends string = string,
    TNonceAuthorityAddress extends string = string,
    TNonceValue extends string = string,
>(
    {
        nonce,
        nonceAccountAddress,
        nonceAuthorityAddress,
    }: DurableNonceConfig<TNonceAccountAddress, TNonceAuthorityAddress, TNonceValue>,
    transactionMessage: TTransactionMessage | (TransactionMessageWithDurableNonceLifetime & TTransactionMessage),
): TransactionMessageWithDurableNonceLifetime<TNonceAccountAddress, TNonceAuthorityAddress, TNonceValue> &
    TTransactionMessage {
    let newInstructions: [
        AdvanceNonceAccountInstruction<TNonceAccountAddress, TNonceAuthorityAddress>,
        ...IInstruction[],
    ];

    const firstInstruction = transactionMessage.instructions[0];
    if (firstInstruction && isAdvanceNonceAccountInstruction(firstInstruction)) {
        if (isAdvanceNonceAccountInstructionForNonce(firstInstruction, nonceAccountAddress, nonceAuthorityAddress)) {
            if (
                isTransactionMessageWithDurableNonceLifetime(transactionMessage) &&
                transactionMessage.lifetimeConstraint.nonce === nonce
            ) {
                return transactionMessage as TransactionMessageWithDurableNonceLifetime<
                    TNonceAccountAddress,
                    TNonceAuthorityAddress,
                    TNonceValue
                > &
                    TTransactionMessage;
            } else {
                // we already have the right first instruction, leave it as-is
                newInstructions = [firstInstruction, ...transactionMessage.instructions.slice(1)];
            }
        } else {
            // we have a different advance nonce instruction as the first instruction, replace it
            newInstructions = [
                Object.freeze(createAdvanceNonceAccountInstruction(nonceAccountAddress, nonceAuthorityAddress)),
                ...transactionMessage.instructions.slice(1),
            ];
        }
    } else {
        // we don't have an existing advance nonce instruction as the first instruction, prepend one
        newInstructions = [
            Object.freeze(createAdvanceNonceAccountInstruction(nonceAccountAddress, nonceAuthorityAddress)),
            ...transactionMessage.instructions,
        ];
    }

    return Object.freeze({
        ...transactionMessage,
        instructions: Object.freeze(newInstructions),
        lifetimeConstraint: Object.freeze({
            nonce,
        }),
    }) as TransactionMessageWithDurableNonceLifetime<TNonceAccountAddress, TNonceAuthorityAddress, TNonceValue> &
        TTransactionMessage;
}
