import { Address, isAddress } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_MODIFYING_SIGNER, SolanaError } from '@solana/errors';

import { SignableMessage } from './signable-message';
import { BaseSignerConfig } from './types';

/**
 * The configuration to optionally provide when calling the
 * {@link MessageModifyingSigner#modifyAndSignMessages | modifyAndSignMessages} method.
 *
 * @see {@link BaseSignerConfig}
 */
export type MessageModifyingSignerConfig = BaseSignerConfig;

/**
 * A signer interface that _potentially_ modifies the content
 * of the provided {@link SignableMessage | SignableMessages} before signing them.
 *
 * For instance, this enables wallets to prefix or suffix nonces to the messages they sign.
 * For each message, instead of returning a {@link SignatureDictionary}, the
 * {@link MessageModifyingSigner#modifyAndSignMessages | modifyAndSignMessages} function
 * returns an updated {@link SignableMessage} with a potentially modified content and signature dictionary.
 *
 * @typeParam TAddress - Supply a string literal to define a signer having a particular address.
 *
 * @example
 * ```ts
 * const signer: MessageModifyingSigner<'1234..5678'> = {
 *     address: address('1234..5678'),
 *     modifyAndSignMessages: async (
 *         messages: SignableMessage[]
 *     ): Promise<SignableMessage[]> => {
 *         // My custom signing logic.
 *     },
 * };
 * ```
 *
 * @remarks
 * Here are the main characteristics of this signer interface:
 *
 * - **Sequential**. Contrary to partial signers, these cannot be executed in
 *   parallel as each call can modify the content of the message.
 * - **First signers**. For a given message, a modifying signer must always be used
 *   before a partial signer as the former will likely modify the message and
 *   thus impact the outcome of the latter.
 * - **Potential conflicts**. If more than one modifying signer is provided, the second
 *   signer may invalidate the signature of the first one. However, modifying signers
 *   may decide not to modify a message based on the existence of signatures for that message.
 *
 * @see {@link SignableMessage}
 * @see {@link createSignableMessage}
 * @see {@link isMessageModifyingSigner}
 * @see {@link assertIsMessageModifyingSigner}
 */
export type MessageModifyingSigner<TAddress extends string = string> = Readonly<{
    address: Address<TAddress>;
    modifyAndSignMessages(
        messages: readonly SignableMessage[],
        config?: MessageModifyingSignerConfig,
    ): Promise<readonly SignableMessage[]>;
}>;

/**
 * Checks whether the provided value implements the {@link MessageModifyingSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { isMessageModifyingSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * isMessageModifyingSigner({ address, modifyAndSignMessages: async () => {} }); // true
 * isMessageModifyingSigner({ address }); // false
 * ```
 *
 * @see {@link assertIsMessageModifyingSigner}
 */
export function isMessageModifyingSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): value is MessageModifyingSigner<TAddress> {
    return (
        isAddress(value.address) &&
        'modifyAndSignMessages' in value &&
        typeof value.modifyAndSignMessages === 'function'
    );
}

/**
 * Asserts that the provided value implements the {@link MessageModifyingSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { assertIsMessageModifyingSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * assertIsMessageModifyingSigner({ address, modifyAndSignMessages: async () => {} }); // void
 * assertIsMessageModifyingSigner({ address }); // Throws an error.
 * ```
 *
 * @see {@link isMessageModifyingSigner}
 */
export function assertIsMessageModifyingSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): asserts value is MessageModifyingSigner<TAddress> {
    if (!isMessageModifyingSigner(value)) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_MODIFYING_SIGNER, {
            address: value.address,
        });
    }
}
