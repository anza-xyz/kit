import type { Address } from '@solana/addresses';
import { address, getPublicKeyFromAddress } from '@solana/addresses';
import { bytesEqual } from '@solana/codecs-core';
import {
    SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE,
    SOLANA_ERROR__WALLET__INVALID_NUMBER_OF_OUTPUTS,
    SolanaError,
} from '@solana/errors';
import { isSignatureBytes, type SignatureBytes, verifySignature } from '@solana/keys';
import { getAbortablePromise } from '@solana/promises';
import type { MessageModifyingSigner, SignableMessage } from '@solana/signers';
import { SolanaSignMessage, SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount, getWalletForHandle } from '@wallet-standard/ui-registry';

/**
 * Creates a {@link MessageModifyingSigner} from a {@link UiWalletAccount}.
 *
 * This function provides a bridge between wallet-standard {@link UiWalletAccount} and the
 * {@link MessageModifyingSigner} interface, allowing any wallet that implements the
 * `solana:signMessage` feature to be used as a message signer.
 *
 * Each signature returned by the wallet is verified against the account's address and the signed
 * message, so a wallet cannot return a signature that was not made by the account.
 *
 * @param uiWalletAccount - The wallet account to create a signer from.
 * @returns A {@link MessageModifyingSigner} that signs messages using the wallet.
 *
 * @throws {@link SOLANA_ERROR__WALLET__INVALID_NUMBER_OF_OUTPUTS} from `modifyAndSignMessages` when the
 * wallet returns a different number of signed messages than it was asked to sign.
 * @throws {@link SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE} from `modifyAndSignMessages` when the
 * wallet returns a signature that is not a valid signature of the signed message by the account.
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

    const account = getWalletAccountForUiWalletAccount(uiWalletAccount);
    const walletName = getWalletForHandle(uiWalletAccount).name;
    const signerAddress = address(uiWalletAccount.address);

    async function assertSignaturesAreValid(outputs: readonly { signature: Uint8Array; signedMessage: Uint8Array }[]) {
        const publicKey = await getPublicKeyFromAddress(signerAddress);
        await Promise.all(
            outputs.map(async ({ signature, signedMessage }) => {
                if (!isSignatureBytes(signature) || !(await verifySignature(publicKey, signature, signedMessage))) {
                    throw new SolanaError(SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE, {
                        address: signerAddress,
                        walletName,
                    });
                }
            }),
        );
    }

    return {
        address: signerAddress,
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

            const walletOutputs = await getAbortablePromise(signMessageFeature.signMessage(...inputs), abortSignal);
            if (walletOutputs.length !== messages.length) {
                throw new SolanaError(SOLANA_ERROR__WALLET__INVALID_NUMBER_OF_OUTPUTS, {
                    actual: walletOutputs.length,
                    expected: messages.length,
                    featureName: SolanaSignMessage,
                    walletName,
                });
            }

            // Copy the wallet's outputs, so that they can't be changed after they are verified.
            const outputs = walletOutputs.map(({ signedMessage, signature }) => ({
                signature: new Uint8Array(signature),
                signedMessage: new Uint8Array(signedMessage),
            }));
            await getAbortablePromise(assertSignaturesAreValid(outputs), abortSignal);

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
