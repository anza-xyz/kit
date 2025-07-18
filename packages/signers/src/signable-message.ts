import { TextEncoder } from '@solana/text-encoding-impl';

import { SignatureDictionary } from './types';

/**
 * Defines a message that needs signing and its current set of signatures if any.
 *
 * This interface allows {@link MessageModifyingSigner | MessageModifyingSigners}
 * to decide on whether or not they should modify the provided message depending
 * on whether or not signatures already exist for such message.
 *
 * It also helps create a more consistent API by providing a structure analogous
 * to transactions which also keep track of their {@link SignatureDictionary}.
 *
 * @example
 * ```ts
 * import { createSignableMessage } from '@solana/signers';
 *
 * const message = createSignableMessage(new Uint8Array([1, 2, 3]));
 * message.content; // The content of the message as bytes.
 * message.signatures; // The current set of signatures for this message.
 * ```
 *
 * @see {@link createSignableMessage}
 */
export type SignableMessage = Readonly<{
    content: Uint8Array;
    signatures: SignatureDictionary;
}>;

/**
 * Creates a {@link SignableMessage} from a `Uint8Array` or a UTF-8 string.
 *
 * It optionally accepts a signature dictionary if the message already contains signatures.
 *
 * @example
 * ```ts
 * const message = createSignableMessage(new Uint8Array([1, 2, 3]));
 * const messageFromText = createSignableMessage('Hello world!');
 * const messageWithSignatures = createSignableMessage('Hello world!', {
 *     [address('1234..5678')]: new Uint8Array([1, 2, 3]) as SignatureBytes,
 * });
 * ```
 */
export function createSignableMessage(
    content: Uint8Array | string,
    signatures: SignatureDictionary = {},
): SignableMessage {
    return Object.freeze({
        content: typeof content === 'string' ? new TextEncoder().encode(content) : content,
        signatures: Object.freeze({ ...signatures }),
    });
}
