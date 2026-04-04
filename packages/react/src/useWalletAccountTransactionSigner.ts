import { address } from '@solana/addresses';
import { SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED, SolanaError } from '@solana/errors';
import { getAbortablePromise } from '@solana/promises';
import { TransactionModifyingSigner } from '@solana/signers';
import {
    getTransactionCodec,
    reconstructEncodedTransactionFromOriginalTransaction,
    Transaction,
    TransactionWithinSizeLimit,
    TransactionWithLifetime,
} from '@solana/transactions';
import { UiWalletAccount } from '@wallet-standard/ui';
import { useMemo, useRef } from 'react';

import { OnlySolanaChains } from './chain';
import { useSignTransaction } from './useSignTransaction';

/**
 * Use this to get a {@link TransactionSigner} capable of signing serialized transactions with the
 * private key of a {@link UiWalletAccount}
 *
 * @returns A {@link TransactionModifyingSigner}. This is a conservative assumption based on the
 * fact that your application can not control whether or not the wallet will modify the transaction
 * before signing it (eg. to add guard instructions, or a priority fee budget). Otherwise this
 * method could more specifically return a {@link TransactionSigner} or a
 * {@link TransactionPartialSigner}.
 *
 * @example
 * ```tsx
 * import { useWalletAccountTransactionSigner } from '@solana/react';
 *
 * function SignTransactionButton({ account, transaction }) {
 *     const transactionSigner = useWalletAccountTransactionSigner(account, 'solana:devnet');
 *     return (
 *         <button
 *             onClick={async () => {
 *                 try {
 *                     const [{ signatures }] = await transactionSigner.modifyAndSignTransactions([transaction]);
 *                     const signatureBytes = signatures[transactionSigner.address];
 *                     window.alert(`Signature bytes: ${signatureBytes.toString()}`);
 *                 } catch (e) {
 *                     console.error('Failed to sign transaction', e);
 *                 }
 *             }}
 *         >
 *             Sign Transaction
 *         </button>
 *     );
 * }
 * ```
 */
export function useWalletAccountTransactionSigner<TWalletAccount extends UiWalletAccount>(
    uiWalletAccount: TWalletAccount,
    chain: OnlySolanaChains<TWalletAccount['chains']>,
): TransactionModifyingSigner<TWalletAccount['address']>;
export function useWalletAccountTransactionSigner<TWalletAccount extends UiWalletAccount>(
    uiWalletAccount: TWalletAccount,
    chain: `solana:${string}`,
): TransactionModifyingSigner<TWalletAccount['address']>;
export function useWalletAccountTransactionSigner<TWalletAccount extends UiWalletAccount>(
    uiWalletAccount: TWalletAccount,
    chain: `solana:${string}`,
): TransactionModifyingSigner<TWalletAccount['address']> {
    const encoderRef = useRef<ReturnType<typeof getTransactionCodec> | null>(null);
    const signTransaction = useSignTransaction(uiWalletAccount, chain);
    return useMemo(
        () => ({
            address: address(uiWalletAccount.address),
            async modifyAndSignTransactions(transactions, config = {}) {
                const { abortSignal, ...options } = config;
                abortSignal?.throwIfAborted();
                const transactionCodec = (encoderRef.current ||= getTransactionCodec());
                if (transactions.length > 1) {
                    throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED);
                }
                if (transactions.length === 0) {
                    return transactions as readonly (Transaction &
                        TransactionWithinSizeLimit &
                        TransactionWithLifetime)[];
                }
                const [transaction] = transactions;
                const wireTransactionBytes = transactionCodec.encode(transaction);
                const inputWithOptions = {
                    ...options,
                    transaction: wireTransactionBytes as Uint8Array,
                };
                const { signedTransaction } = await getAbortablePromise(signTransaction(inputWithOptions), abortSignal);
                const reconstructedTransaction = await reconstructEncodedTransactionFromOriginalTransaction(
                    transaction,
                    signedTransaction,
                );
                return Object.freeze([reconstructedTransaction]);
            },
        }),
        [uiWalletAccount.address, signTransaction],
    );
}
