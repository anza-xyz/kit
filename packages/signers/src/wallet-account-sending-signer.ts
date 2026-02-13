import { address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED, SolanaError } from '@solana/errors';
import { SignatureBytes } from '@solana/keys';
import { getAbortablePromise } from '@solana/promises';
import { getTransactionEncoder } from '@solana/transactions';
import { SolanaSignAndSendTransaction, SolanaSignAndSendTransactionFeature } from '@solana/wallet-standard-features';
import {
    WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
    WalletStandardError,
} from '@wallet-standard/errors';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

import { TransactionSendingSigner } from './transaction-sending-signer';

/**
 * Creates a {@link TransactionSendingSigner} from a {@link UiWalletAccount}.
 *
 * This function provides a bridge between wallet-standard {@link UiWalletAccount} and the
 * {@link TransactionSendingSigner} interface, allowing any wallet that implements the
 * `solana:signAndSendTransaction` feature to sign and send transactions.
 *
 * @param uiWalletAccount - The wallet account to create a signer from.
 * @param chain - The Solana chain identifier (e.g., 'solana:devnet', 'solana:mainnet').
 * @returns A {@link TransactionSendingSigner} that signs and sends transactions using the wallet.
 *
 * @throws {WalletStandardError} If the wallet account does not support the specified chain.
 *
 * @example
 * ```ts
 * import { createSendingSignerFromWalletAccount } from '@solana/signers';
 *
 * const signer = createSendingSignerFromWalletAccount(walletAccount, 'solana:devnet');
 * const [signature] = await signer.signAndSendTransactions([transaction]);
 * ```
 *
 * @see {@link TransactionSendingSigner}
 * @see {@link createSignerFromWalletAccount}
 */
export function createSendingSignerFromWalletAccount<TWalletAccount extends UiWalletAccount>(
    uiWalletAccount: TWalletAccount,
    chain: `solana:${string}`,
): TransactionSendingSigner<TWalletAccount['address']> {
    if (!uiWalletAccount.chains.includes(chain)) {
        throw new WalletStandardError(WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED, {
            address: uiWalletAccount.address,
            chain,
            featureName: SolanaSignAndSendTransaction,
            supportedChains: [...uiWalletAccount.chains],
            supportedFeatures: [...uiWalletAccount.features],
        });
    }

    const feature = getWalletAccountFeature(
        uiWalletAccount,
        SolanaSignAndSendTransaction,
    ) as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];

    const walletAccount = getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(uiWalletAccount);

    const transactionEncoder = getTransactionEncoder();

    return {
        address: address(uiWalletAccount.address),

        async signAndSendTransactions(transactions, config = {}) {
            const { abortSignal, ...options } = config;
            abortSignal?.throwIfAborted();
            if (transactions.length > 1) {
                throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED);
            }
            if (transactions.length === 0) {
                return [];
            }
            const [transaction] = transactions;
            const wireTransactionBytes = transactionEncoder.encode(transaction);
            const input = {
                account: walletAccount,
                chain,
                transaction: wireTransactionBytes as Uint8Array,
                ...(options?.minContextSlot != null
                    ? {
                          options: {
                              minContextSlot: Number(options.minContextSlot),
                          },
                      }
                    : null),
            };

            // Wallet Standard returns an array of results even for a single transaction, this signer enforces exactly one.
            const outputs = await getAbortablePromise(feature.signAndSendTransaction(input), abortSignal);
            if (outputs.length !== 1) {
                throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED);
            }
            return Object.freeze([outputs[0].signature as SignatureBytes]);
        },
    };
}
