import type { Address } from '@solana/addresses';
import { address } from '@solana/addresses';
import { bytesEqual } from '@solana/codecs-core';
import type { SignatureBytes } from '@solana/keys';
import { getAbortablePromise } from '@solana/promises';
import type { MessageModifyingSigner, SignableMessage } from '@solana/signers';
import { SolanaSignMessage, SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

/**
 * Creates a {@link MessageModifyingSigner} from a {@link UiWalletAccount}.
 *
 * This function provides a bridge between wallet-standard {@link UiWalletAccount} and the
 * {@link MessageModifyingSigner} interface, allowing any wallet that implements the
 * `solana:signMessage` feature to be used as a message signer.
 *
 * @param uiWalletAccount - The wallet account to create a signer from.
 * @returns A {@link MessageModifyingSigner} that signs messages using the wallet.
 *
 * @example
 * ```ts
 * import { createMessageSignerFromWalletAccount } from '@solana/wallet-account-signer';
 * import { createSignableMessage } from '@solana/signers';
 *
 * const signer = createMessageSignerFromWalletAccount(walletAccount);
 * const message = createSignableMessage(new Uint8Array([1, 2, 3]));
 * const [signedMessage] = await signer.modifyAndSignMessages([message]);
 * const signature = signedMessage.signatures[signer.address];
 * ```
 *
 * @see {@link MessageModifyingSigner}
 * @see {@link SignableMessage}
 */
export function createMessageSignerFromWalletAccount<TWalletAccount extends UiWalletAccount>(
    uiWalletAccount: TWalletAccount,
): MessageModifyingSigner<TWalletAccount['address']> {
    const signMessageFeature = getWalletAccountFeature(
        uiWalletAccount,
        SolanaSignMessage,
    ) as SolanaSignMessageFeature[typeof SolanaSignMessage];

    const account = getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(uiWalletAccount);

    return {
        address: address(uiWalletAccount.address),
        async modifyAndSignMessages(messages, config = {}) {
            const { abortSignal } = config;
            abortSignal?.throwIfAborted();

            if (messages.length === 0) {
                return messages;
            }

            const inputs = messages.map(message => ({
                account,
                message: message.content,
            }));

            const outputs = await getAbortablePromise(signMessageFeature.signMessage(...inputs), abortSignal);

            const results = outputs.map((output, index) => {
                const originalMessage = messages[index];
                const { signedMessage, signature } = output;

                // Check if message was modified
                const messageWasModified =
                    originalMessage.content.length !== signedMessage.length ||
                    originalMessage.content.some((originalByte, ii) => originalByte !== signedMessage[ii]);

                // Check if signature is new
                const originalSignature = originalMessage.signatures[uiWalletAccount.address as Address<string>] as
                    | SignatureBytes
                    | undefined;
                const signatureIsNew = originalSignature === undefined || !bytesEqual(originalSignature, signature);

                // Identity preservation: no changes at all
                if (!signatureIsNew && !messageWasModified) {
                    return originalMessage;
                }

                // Signature dictionary logic
                const nextSignatureMap = messageWasModified
                    ? { [uiWalletAccount.address]: signature }
                    : { ...originalMessage.signatures, [uiWalletAccount.address]: signature };

                return Object.freeze({
                    content: signedMessage,
                    signatures: Object.freeze(nextSignatureMap),
                }) as SignableMessage;
            });

            return results;
        },
    };
}
