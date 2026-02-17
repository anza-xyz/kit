import { address } from '@solana/addresses';
import { bytesEqual } from '@solana/codecs-core';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';
import {
    assertIsTransactionWithinSizeLimit,
    getTransactionCodec,
    getTransactionLifetimeConstraintFromCompiledTransactionMessage,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/transactions';
import { SolanaChain } from '@solana/wallet-standard-chains';
import { SolanaSignTransaction, SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import {
    WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
    WalletStandardError,
} from '@wallet-standard/errors';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

import { TransactionModifyingSigner } from './transaction-modifying-signer';

/**
 * Creates a {@link TransactionModifyingSigner} from a {@link UiWalletAccount}.
 *
 * This function provides a bridge between wallet-standard {@link UiWalletAccount} and the
 * {@link TransactionModifyingSigner} interface, allowing any wallet that implements the
 * `solana:signTransaction` feature to be used as a transaction signer.
 *
 * @param uiWalletAccount - The wallet account to create a signer from.
 * @param chain - The Solana chain identifier (e.g., 'solana:devnet', 'solana:mainnet').
 * @returns A {@link TransactionModifyingSigner} that signs transactions using the wallet.
 *
 * @throws {WalletStandardError} If the wallet account does not support the specified chain.
 *
 * @example
 * ```ts
 * import { createSignerFromWalletAccount } from '@solana/signers';
 *
 * const signer = createSignerFromWalletAccount(walletAccount, 'solana:devnet');
 * const [signedTransaction] = await signer.modifyAndSignTransactions([transaction]);
 * ```
 *
 * @see {@link TransactionModifyingSigner}
 * @see {@link createSendingSignerFromWalletAccount}
 */
export function createSignerFromWalletAccount<TWalletAccount extends UiWalletAccount>(
    uiWalletAccount: TWalletAccount,
    chain: SolanaChain,
): TransactionModifyingSigner<TWalletAccount['address']> {
    if (!uiWalletAccount.chains.includes(chain)) {
        throw new WalletStandardError(WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED, {
            address: uiWalletAccount.address,
            chain,
            featureName: SolanaSignTransaction,
            supportedChains: uiWalletAccount.chains,
            supportedFeatures: uiWalletAccount.features,
        });
    }
    const signTransactionFeature = getWalletAccountFeature(
        uiWalletAccount,
        SolanaSignTransaction,
    ) as SolanaSignTransactionFeature[typeof SolanaSignTransaction];
    const account = getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(uiWalletAccount);

    const transactionCodec = getTransactionCodec();

    return {
        address: address(uiWalletAccount.address),
        async modifyAndSignTransactions(transactions, config = {}) {
            const { abortSignal, ...options } = config;
            abortSignal?.throwIfAborted();
            if (transactions.length === 0) {
                return transactions as readonly (Transaction & TransactionWithinSizeLimit & TransactionWithLifetime)[];
            }

            const inputs = transactions.map(transaction => ({
                account: account,
                chain,
                transaction: transactionCodec.encode(transaction) as Uint8Array,
                ...(options?.minContextSlot != null
                    ? {
                          options: {
                              minContextSlot: Number(options.minContextSlot),
                          },
                      }
                    : null),
            }));

            const outputs = await signTransactionFeature.signTransaction(...inputs);

            const results = await Promise.all(
                outputs.map(async ({ signedTransaction }, index) => {
                    const decodedSignedTransaction = transactionCodec.decode(
                        signedTransaction,
                    ) as (typeof transactions)[number];

                    assertIsTransactionWithinSizeLimit(decodedSignedTransaction);

                    // Use the input transaction at the same index if available for lifetime comparison
                    const inputTransaction = transactions[index];
                    const existingLifetime =
                        inputTransaction && 'lifetimeConstraint' in inputTransaction
                            ? (inputTransaction as TransactionWithLifetime).lifetimeConstraint
                            : undefined;

                    if (existingLifetime) {
                        if (
                            inputTransaction &&
                            bytesEqual(decodedSignedTransaction.messageBytes, inputTransaction.messageBytes)
                        ) {
                            // If the transaction has identical bytes, the lifetime won't have changed
                            return Object.freeze({
                                ...decodedSignedTransaction,
                                lifetimeConstraint: existingLifetime,
                            });
                        }

                        // If the transaction has changed, check the lifetime constraint field
                        const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(
                            decodedSignedTransaction.messageBytes,
                        );
                        const currentToken =
                            'blockhash' in existingLifetime ? existingLifetime.blockhash : existingLifetime.nonce;

                        if (compiledTransactionMessage.lifetimeToken === currentToken) {
                            return Object.freeze({
                                ...decodedSignedTransaction,
                                lifetimeConstraint: existingLifetime,
                            });
                        }
                    }

                    // If we get here then there is no existing lifetime, or the lifetime has changed. We need to attach a new lifetime
                    const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(
                        decodedSignedTransaction.messageBytes,
                    );
                    const lifetimeConstraint =
                        await getTransactionLifetimeConstraintFromCompiledTransactionMessage(compiledTransactionMessage);
                    return Object.freeze({
                        ...decodedSignedTransaction,
                        lifetimeConstraint,
                    });
                }),
            );

            return results;
        },
    };
}
