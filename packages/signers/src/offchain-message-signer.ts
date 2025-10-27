import { OffchainMessage, OffchainMessageSignatory } from '@solana/offchain-messages';

import { deduplicateSigners } from './deduplicate-signers';
import { MessageSigner } from './message-signer';

/**
 * An extension of the {@link OffchainMessageSignatory} type that allows us to store
 * {@link MessageSigner | MessageSigners} inside it.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for the {@link MessageSigner} to use.
 *
 * @interface
 *
 * @example
 * ```ts
 * import { generateKeyPairSigner, OffchainMessageSignatoryWithSigner } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * const messageSignatory: OffchainMessageSignatoryWithSigner = {
 *     address: signer.address,
 *     signer,
 * };
 * ```
 */
export type OffchainMessageSignatoryWithSigner<TAddress extends string = string> = MessageSigner<TAddress>;

/**
 * An {@link OffchainMessage} type extension that accepts {@link MessageSigner | MessageSigners}.
 *
 * Namely, it allows {@link OffchainMessageSignatoryWithSigners} to be used in its array of required
 * signatories.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for {@link MessageSigner | MessageSigners}.
 *
 * @example
 * ```ts
 * import { OffchainMessage } from '@solana/offchain-messages';
 * import { generateKeyPairSigner, OffchainMessageWithSigners } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * const firstSignatory: OffchainMessageSignatory = { /* ... *\/ };
 * const secondSignatory: OffchainMessageSignatoryWithSigner = { /* ... *\/ };
 * const offchainMessage: OffchainMessage & OffchainMessageWithSigners = {
 *     // ...
 *     requiredSignatories: [firstSignatory, secondSignatory],
 * };
 * ```
 */
export type OffchainMessageWithSigners<
    TAddress extends string = string,
    TSigner extends OffchainMessageSignatoryWithSigner<TAddress> = OffchainMessageSignatoryWithSigner<TAddress>,
> = Omit<OffchainMessage, 'requiredSignatories'> &
    Readonly<{
        requiredSignatories: readonly (OffchainMessageSignatory | TSigner)[];
    }>;

/**
 * Extracts and deduplicates all {@link MessageSigner | MessageSigners} stored inside a given
 * {@link OffchainMessageWithSigners | offchain message}.
 *
 * Any extracted signers that share the same {@link Address} will be de-duplicated.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for {@link MessageSigner | MessageSigners}.
 * @typeParam TOffchainMessage - The inferred type of the offchain message provided.
 *
 * @example
 * ```ts
 * import { Instruction } from '@solana/offchain-messages';
 * import { InstructionWithSigners, OffchainMessageWithSigners, getSignersFromOffchainMessage } from '@solana/signers';
 *
 * const signerA = { address: address('1111..1111'), signMessages: async () => {} };
 * const signerB = { address: address('2222..2222'), signMessages: async () => {} };
 * const firstSignatory: OffchainMessageSignatoryWithSigners = {
 *     address: signerA.address,
 *     signer: signerA,
 * };
 * const secondSignatory: OffchainMessageSignatoryWithSigners = {
 *     address: signerB.address,
 *     signer: signerB,
 * };
 * const OffchainMessage: OffchainMessageWithSigners = {
 *     /* ... *\/
 *     requiredSignatories: [firstSignatory, secondSignatory],
 * };
 *
 * const messageSigners = getSignersFromOffchainMessage(offchainMessage);
 * // ^ [signerA, signerB]
 * ```
 */
export function getSignersFromOffchainMessage<
    TAddress extends string = string,
    TSigner extends MessageSigner<TAddress> = MessageSigner<TAddress>,
    TOffchainMessage extends OffchainMessageWithSigners<TAddress, TSigner> = OffchainMessageWithSigners<
        TAddress,
        TSigner
    >,
>(offchainMessage: TOffchainMessage): readonly TSigner[] {
    const signers = offchainMessage.requiredSignatories.filter(s => 'signMessages' in s) as TSigner[];
    return deduplicateSigners(signers);
}
