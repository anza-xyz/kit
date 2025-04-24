import type { GetEpochInfoApi, GetSignatureStatusesApi, Rpc, SendTransactionApi } from '@solana/rpc';
import type { RpcSubscriptions, SignatureNotificationsApi, SlotNotificationsApi } from '@solana/rpc-subscriptions';
import {
    createBlockHeightExceedencePromiseFactory,
    createRecentSignatureConfirmationPromiseFactory,
    TransactionWithLastValidBlockHeight,
    waitForRecentTransactionConfirmation,
} from '@solana/transaction-confirmation';
import { FullySignedTransaction } from '@solana/transactions';

import { sendAndConfirmTransactionWithLastValidBlockHeight_INTERNAL_ONLY_DO_NOT_EXPORT } from './send-transaction-internal';

type SendAndConfirmTransactionWithLastValidBlockHeightFunction = (
    transaction: FullySignedTransaction & TransactionWithLastValidBlockHeight,
    config: Omit<
        Parameters<typeof sendAndConfirmTransactionWithLastValidBlockHeight_INTERNAL_ONLY_DO_NOT_EXPORT>[0],
        'confirmRecentTransaction' | 'rpc' | 'transaction'
    >,
) => Promise<void>;

type SendAndConfirmTransactionWithLastValidBlockHeightFactoryConfig<TCluster> = {
    /** An object that supports the {@link GetSignatureStatusesApi} and the {@link SendTransactionApi} of the Solana RPC API */
    rpc: Rpc<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi> & { '~cluster'?: TCluster };
    /** An object that supports the {@link SignatureNotificationsApi} and the {@link SlotNotificationsApi} of the Solana RPC Subscriptions API */
    rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi & SlotNotificationsApi> & { '~cluster'?: TCluster };
};

/**
 * Returns a function that you can call to send a blockhash-based transaction to the network and to
 * wait until it has been confirmed.
 *
 * @param config
 *
 * @example
 * ```ts
 * import { isSolanaError, sendAndConfirmTransactionFactory, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED } from '@solana/kit';
 *
 * const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
 *
 * try {
 *     await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 * } catch (e) {
 *     if (isSolanaError(e, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED)) {
 *         console.error('This transaction depends on a blockhash that has expired');
 *     } else {
 *         throw e;
 *     }
 * }
 * ```
 */
export function sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
}: SendAndConfirmTransactionWithLastValidBlockHeightFactoryConfig<'devnet'>): SendAndConfirmTransactionWithLastValidBlockHeightFunction;
export function sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
}: SendAndConfirmTransactionWithLastValidBlockHeightFactoryConfig<'testnet'>): SendAndConfirmTransactionWithLastValidBlockHeightFunction;
export function sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
}: SendAndConfirmTransactionWithLastValidBlockHeightFactoryConfig<'mainnet'>): SendAndConfirmTransactionWithLastValidBlockHeightFunction;
export function sendAndConfirmTransactionFactory<TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void>({
    rpc,
    rpcSubscriptions,
}: SendAndConfirmTransactionWithLastValidBlockHeightFactoryConfig<TCluster>): SendAndConfirmTransactionWithLastValidBlockHeightFunction {
    const getBlockHeightExceedencePromise = createBlockHeightExceedencePromiseFactory({
        rpc,
        rpcSubscriptions,
    } as Parameters<typeof createBlockHeightExceedencePromiseFactory>[0]);
    const getRecentSignatureConfirmationPromise = createRecentSignatureConfirmationPromiseFactory({
        rpc,
        rpcSubscriptions,
    } as Parameters<typeof createRecentSignatureConfirmationPromiseFactory>[0]);
    async function confirmRecentTransaction(
        config: Omit<
            Parameters<typeof waitForRecentTransactionConfirmation>[0],
            'getBlockHeightExceedencePromise' | 'getRecentSignatureConfirmationPromise'
        >,
    ) {
        await waitForRecentTransactionConfirmation({
            ...config,
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
        });
    }
    return async function sendAndConfirmTransaction(transaction, config) {
        await sendAndConfirmTransactionWithLastValidBlockHeight_INTERNAL_ONLY_DO_NOT_EXPORT({
            ...config,
            confirmRecentTransaction,
            rpc,
            transaction,
        });
    };
}
