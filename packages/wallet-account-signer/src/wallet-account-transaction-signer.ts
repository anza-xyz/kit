import { address } from '@solana/addresses';
import { getAbortablePromise } from '@solana/promises';
import { TransactionModifyingSigner } from '@solana/signers';
import {
    getTransactionCodec,
    reconstructEncodedTransactionFromOriginalTransaction,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/transactions';
import { SolanaChain } from '@solana/wallet-standard-chains';
import { SolanaSignTransaction, SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import { IdentifierString } from '@wallet-standard/base';
import {
    WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
    WalletStandardError,
} from '@wallet-standard/errors';
import { getWalletAccountFeature, UiWalletAccount } from '@wallet-standard/ui';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';

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
 * import { createTransactionSignerFromWalletAccount } from '@solana/wallet-account-signer';
 *
 * const signer = createTransactionSignerFromWalletAccount(walletAccount, 'solana:devnet');
 * const [signedTransaction] = await signer.modifyAndSignTransactions([transaction]);
 * ```
 *
 * @see {@link TransactionModifyingSigner}
 * @see {@link createTransactionSendingSignerFromWalletAccount}
 */
export function createTransactionSignerFromWalletAccount<TWalletAccount extends UiWalletAccount>(
    uiWalletAccount: TWalletAccount,
    chain: SolanaChain | (IdentifierString & {}),
): TransactionModifyingSigner<TWalletAccount['address']> {
    if (!uiWalletAccount.chains.includes(chain)) {
        throw new WalletStandardError(WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED, {
            address: uiWalletAccount.address,
            chain,
            featureName: SolanaSignTransaction,
            supportedChains: uiWalletAccount.chains as string[],
            supportedFeatures: uiWalletAccount.features as string[],
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

            const outputs = await getAbortablePromise(signTransactionFeature.signTransaction(...inputs), abortSignal);

            const results = await getAbortablePromise(
                Promise.all(
                    outputs.map(({ signedTransaction }, index) =>
                        reconstructEncodedTransactionFromOriginalTransaction(transactions[index], signedTransaction),
                    ),
                ),
                abortSignal,
            );

            return results;
        },
    };
}
