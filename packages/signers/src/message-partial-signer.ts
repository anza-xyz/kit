import { Address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_PARTIAL_SIGNER, SolanaError } from '@solana/errors';

import { SignableMessage } from './signable-message';
import { BaseSignerConfig, SignatureDictionary } from './types';

/**
 * The configuration to optionally provide when calling the
 * {@link MessagePartialSigner#signMessages | signMessages} method.
 *
 * @see {@link BaseSignerConfig}
 */
export type MessagePartialSignerConfig = BaseSignerConfig;

/**
 * A signer interface that signs an array of {@link SignableMessage | SignableMessages}
 * without modifying their content.
 *
 * It defines a {@link MessagePartialSigner#signMessages | signMessages} function
 * that returns a {@link SignatureDictionary} for each provided message.
 * Such signature dictionaries are expected to be merged with the existing ones if any.
 *
 * @typeParam TAddress - Supply a string literal to define a signer having a particular address.
 *
 * @example
 * ```ts
 * const signer: MessagePartialSigner<'1234..5678'> = {
 *     address: address('1234..5678'),
 *     signMessages: async (
 *         messages: SignableMessage[]
 *     ): Promise<SignatureDictionary[]> => {
 *         // My custom signing logic.
 *     },
 * };
 * ```
 *
 * @remarks
 * Here are the main characteristics of this signer interface:
 *
 * - **Parallel**. When multiple signers sign the same message, we can
 *   perform this operation in parallel to obtain all their signatures.
 * - **Flexible order**. The order in which we use these signers
 *   for a given message doesn’t matter.
 *
 * @see {@link SignableMessage}
 * @see {@link createSignableMessage}
 * @see {@link isMessagePartialSigner}
 * @see {@link assertIsMessagePartialSigner}
 */
export type MessagePartialSigner<TAddress extends string = string> = Readonly<{
    address: Address<TAddress>;
    signMessages(
        messages: readonly SignableMessage[],
        config?: MessagePartialSignerConfig,
    ): Promise<readonly SignatureDictionary[]>;
}>;

/**
 * Checks whether the provided value implements the {@link MessagePartialSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { isMessagePartialSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * isMessagePartialSigner({ address, signMessages: async () => {} }); // true
 * isMessagePartialSigner({ address }); // false
 * ```
 *
 * @see {@link assertIsMessagePartialSigner}
 */
export function isMessagePartialSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): value is MessagePartialSigner<TAddress> {
    return 'signMessages' in value && typeof value.signMessages === 'function';
}

/**
 * Asserts that the provided value implements the {@link MessagePartialSigner} interface.
 *
 * @typeParam TAddress - The inferred type of the address provided.
 *
 * @example
 * ```ts
 * import { Address } from '@solana/addresses';
 * import { assertIsMessagePartialSigner } from '@solana/signers';
 *
 * const address = '1234..5678' as Address<'1234..5678'>;
 * assertIsMessagePartialSigner({ address, signMessages: async () => {} }); // void
 * assertIsMessagePartialSigner({ address }); // Throws an error.
 * ```
 *
 * @see {@link isMessagePartialSigner}
 */
export function assertIsMessagePartialSigner<TAddress extends string>(value: {
    [key: string]: unknown;
    address: Address<TAddress>;
}): asserts value is MessagePartialSigner<TAddress> {
    if (!isMessagePartialSigner(value)) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__EXPECTED_MESSAGE_PARTIAL_SIGNER, {
            address: value.address,
        });
    }
}
