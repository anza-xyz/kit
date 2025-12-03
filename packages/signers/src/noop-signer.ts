import { Address } from '@solana/addresses';

import { MessagePartialSigner } from './message-partial-signer';
import { TransactionPartialSigner } from './transaction-partial-signer';

/**
 * Defines a Noop (No-Operation) signer that pretends to partially sign messages and transactions.
 *
 * For a given {@link Address}, a Noop Signer can be created to offer an implementation of both
 * the {@link MessagePartialSigner} and {@link TransactionPartialSigner} interfaces such that
 * they do not sign anything. Namely, signing a transaction or a message with a `NoopSigner`
 * will return an empty `SignatureDictionary`.
 *
 * @typeParam TAddress - Supply a string literal to define a Noop signer having a particular address.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { createNoopSigner } from '@solana/signers';
 *
 * const signer = createNoopSigner(address('1234..5678'));
 * const [messageSignatures] = await signer.signMessages([message]);
 * const [transactionSignatures] = await signer.signTransactions([transaction]);
 * // ^ Both messageSignatures and transactionSignatures are empty.
 * ```
 *
 * @remarks
 * This signer may be useful:
 *
 * - For testing purposes.
 * - For indicating that a given account is a signer and taking the responsibility to provide
 *   the signature for that account ourselves. For instance, if we need to send the transaction
 *   to a server that will sign it and send it for us.
 *
 * @see {@link createNoopSigner}
 */
export type NoopSigner<TAddress extends string = string> = MessagePartialSigner<TAddress> &
    TransactionPartialSigner<TAddress>;

/**
 * Creates a {@link NoopSigner} from the provided {@link Address}.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { address } from '@solana/addresses';
 * import { createNoopSigner } from '@solana/signers';
 *
 * const signer = createNoopSigner(address('1234..5678'));
 * ```
 */
export function createNoopSigner<TAddress extends string = string>(address: Address<TAddress>): NoopSigner<TAddress> {
    const out: NoopSigner<TAddress> = {
        address,
        signMessages: messages => Promise.resolve(messages.map(() => Object.freeze({}))),
        signTransactions: transactions => Promise.resolve(transactions.map(() => Object.freeze({}))),
    };

    return Object.freeze(out);
}
