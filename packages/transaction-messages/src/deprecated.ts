import type { Address } from '@solana/addresses';

import {
    assertIsTransactionMessageWithDurableNonceLifetime,
    isTransactionMessageWithDurableNonceLifetime,
} from './durable-nonce';

/**
 * Represents a transaction message for which a fee payer has been declared. A transaction must
 * conform to this type to be compiled and landed on the network.
 *
 * @deprecated Use {@link TransactionMessageWithFeePayer} instead. It was only renamed.
 */
export interface ITransactionMessageWithFeePayer<TAddress extends string = string> {
    readonly feePayer: Readonly<{ address: Address<TAddress> }>;
}

/**
 * From time to time you might acquire a transaction message, that you expect to have a
 * nonce-based lifetime, from an untrusted network API or user input. Use this function to assert
 * that such a transaction message actually has a nonce-based lifetime.
 *
 * @deprecated Use {@link assertIsTransactionMessageWithDurableNonceLifetime} instead. It was only renamed.
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
export const assertIsDurableNonceTransactionMessage = assertIsTransactionMessageWithDurableNonceLifetime;

/**
 * A type guard that returns `true` if the transaction message conforms to the
 * {@link TransactionMessageWithDurableNonceLifetime} type, and refines its type for use in your
 * program.
 *
 * @deprecated Use {@link isTransactionMessageWithDurableNonceLifetime} instead. It was only renamed.
 *
 * @example
 * ```ts
 * import { isDurableNonceTransaction } from '@solana/transaction-messages';
 * import { fetchNonce } from "@solana-program/system";
 *
 * if (isDurableNonceTransaction(message)) {
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
export const isDurableNonceTransaction = isTransactionMessageWithDurableNonceLifetime;
