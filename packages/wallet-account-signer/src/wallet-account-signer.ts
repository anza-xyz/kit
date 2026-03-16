import { address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__WALLET_ACCOUNT_CANNOT_SIGN_TRANSACTION, SolanaError } from '@solana/errors';
import type { MessageSigner, TransactionSigner } from '@solana/signers';
import { SolanaChain } from '@solana/wallet-standard-chains';
import {
    SolanaSignAndSendTransaction,
    SolanaSignMessage,
    SolanaSignTransaction,
} from '@solana/wallet-standard-features';
import {
    WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
    WalletStandardError,
} from '@wallet-standard/errors';
import { UiWalletAccount } from '@wallet-standard/ui';

import { createMessageSignerFromWalletAccount } from './wallet-account-message-signer';
import { createTransactionSendingSignerFromWalletAccount } from './wallet-account-transaction-sending-signer';
import { createTransactionSignerFromWalletAccount } from './wallet-account-transaction-signer';

/**
 * Creates a combined signer from a {@link UiWalletAccount} that exposes all signing capabilities
 * the wallet account supports.
 *
 * Unlike the more specific helpers ({@link createTransactionSignerFromWalletAccount},
 * {@link createTransactionSendingSignerFromWalletAccount},
 * {@link createMessageSignerFromWalletAccount}), this function inspects the wallet account's
 * features at call time and returns a single signer object with whichever of the following methods
 * are available:
 *
 * - `modifyAndSignTransactions` — present when the `solana:signTransaction` feature is available.
 * - `signAndSendTransactions` — present when the `solana:signAndSendTransaction` feature is available.
 * - `modifyAndSignMessages` — present when the `solana:signMessage` feature is available.
 *
 * At least one of `solana:signTransaction` or `solana:signAndSendTransaction` must be present,
 * otherwise an error is thrown. `solana:signMessage` is optional.
 *
 * @param uiWalletAccount - The wallet account to create a signer from.
 * @param chain - The Solana chain identifier (e.g., `'solana:devnet'`, `'solana:mainnet'`).
 * @returns A {@link TransactionSigner}, optionally combined with a {@link MessageSigner}, depending
 * on the features available on the wallet account.
 *
 * @throws {WalletStandardError} If the wallet account does not support the specified chain.
 * @throws {WalletStandardError} If the wallet account supports neither `solana:signTransaction`
 * nor `solana:signAndSendTransaction`.
 *
 * @example
 * ```ts
 * import { createSignerFromWalletAccount } from '@solana/wallet-account-signer';
 * import { isMessageSigner } from '@solana/signers';
 *
 * const signer = createSignerFromWalletAccount(walletAccount, 'solana:devnet');
 *
 * // Sign a transaction (always available — at least one tx feature must exist)
 * if ('modifyAndSignTransactions' in signer) {
 *     const [signedTransaction] = await signer.modifyAndSignTransactions([transaction]);
 * }
 *
 * // Also sign messages if the wallet supports it
 * if (isMessageSigner(signer)) {
 *     const [signedMessage] = await signer.modifyAndSignMessages([message]);
 * }
 * ```
 *
 * @see {@link createTransactionSignerFromWalletAccount}
 * @see {@link createTransactionSendingSignerFromWalletAccount}
 * @see {@link createMessageSignerFromWalletAccount}
 */
export function createSignerFromWalletAccount<TWalletAccount extends UiWalletAccount>(
    uiWalletAccount: TWalletAccount,
    chain: SolanaChain,
):
    | TransactionSigner<TWalletAccount['address']>
    | (MessageSigner<TWalletAccount['address']> & TransactionSigner<TWalletAccount['address']>) {
    if (!uiWalletAccount.chains.includes(chain)) {
        throw new WalletStandardError(WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED, {
            address: uiWalletAccount.address,
            chain,
            featureName: SolanaSignTransaction,
            supportedChains: uiWalletAccount.chains as string[],
            supportedFeatures: uiWalletAccount.features as string[],
        });
    }

    const features = uiWalletAccount.features;
    const hasSignTransaction = features.includes(SolanaSignTransaction);
    const hasSignAndSendTransaction = features.includes(SolanaSignAndSendTransaction);
    const hasSignMessage = features.includes(SolanaSignMessage);

    if (!hasSignTransaction && !hasSignAndSendTransaction) {
        throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_ACCOUNT_CANNOT_SIGN_TRANSACTION, {
            address: uiWalletAccount.address,
            supportedFeatures: features as string[],
        });
    }

    const signer: Record<string, unknown> = {
        address: address(uiWalletAccount.address),
    };

    if (hasSignTransaction) {
        const { modifyAndSignTransactions } = createTransactionSignerFromWalletAccount(uiWalletAccount, chain);
        signer['modifyAndSignTransactions'] = modifyAndSignTransactions;
    }

    if (hasSignAndSendTransaction) {
        const { signAndSendTransactions } = createTransactionSendingSignerFromWalletAccount(uiWalletAccount, chain);
        signer['signAndSendTransactions'] = signAndSendTransactions;
    }

    if (hasSignMessage) {
        const { modifyAndSignMessages } = createMessageSignerFromWalletAccount(uiWalletAccount);
        signer['modifyAndSignMessages'] = modifyAndSignMessages;
    }

    return Object.freeze(signer) as
        | TransactionSigner<TWalletAccount['address']>
        | (MessageSigner<TWalletAccount['address']> & TransactionSigner<TWalletAccount['address']>);
}
