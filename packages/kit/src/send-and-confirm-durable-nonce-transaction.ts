import { getSolanaErrorFromTransactionError, isSolanaError, SOLANA_ERROR__INVALID_NONCE } from '@solana/errors';
import { Signature } from '@solana/keys';
import type { GetAccountInfoApi, GetSignatureStatusesApi, Rpc, SendTransactionApi } from '@solana/rpc';
import type { AccountNotificationsApi, RpcSubscriptions, SignatureNotificationsApi } from '@solana/rpc-subscriptions';
import { commitmentComparator } from '@solana/rpc-types';
import {
    createNonceInvalidationPromiseFactory,
    createRecentSignatureConfirmationPromiseFactory,
    waitForDurableNonceTransactionConfirmation,
} from '@solana/transaction-confirmation';
import {
    getSignatureFromTransaction,
    SendableTransaction,
    Transaction,
    TransactionWithDurableNonceLifetime,
} from '@solana/transactions';

import { sendAndConfirmDurableNonceTransaction_INTERNAL_ONLY_DO_NOT_EXPORT } from './send-transaction-internal';

type SendAndConfirmDurableNonceTransactionFunction = (
    transaction: SendableTransaction & Transaction & TransactionWithDurableNonceLifetime,
    config: Omit<
        Parameters<typeof sendAndConfirmDurableNonceTransaction_INTERNAL_ONLY_DO_NOT_EXPORT>[0],
        'confirmDurableNonceTransaction' | 'rpc' | 'transaction'
    >,
) => Promise<void>;

type SendAndConfirmDurableNonceTransactionFactoryConfig<TCluster> = {
    /** An object that supports the {@link GetSignatureStatusesApi} and the {@link SendTransactionApi} of the Solana RPC API */
    rpc: Rpc<GetAccountInfoApi & GetSignatureStatusesApi & SendTransactionApi> & { '~cluster'?: TCluster };
    /** An object that supports the {@link AccountNotificationsApi} and the {@link SignatureNotificationsApi} of the Solana RPC Subscriptions API */
    rpcSubscriptions: RpcSubscriptions<AccountNotificationsApi & SignatureNotificationsApi> & { '~cluster'?: TCluster };
};

/**
 * Returns a function that you can call to send a nonce-based transaction to the network and to wait
 * until it has been confirmed.
 *
 * @param config
 *
 * @example
 * ```ts
 * import {
 *     isSolanaError,
 *     sendAndConfirmDurableNonceTransactionFactory,
 *     SOLANA_ERROR__INVALID_NONCE,
 *     SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND,
 * } from '@solana/kit';
 *
 * const sendAndConfirmNonceTransaction = sendAndConfirmDurableNonceTransactionFactory({ rpc, rpcSubscriptions });
 *
 * try {
 *     await sendAndConfirmNonceTransaction(transaction, { commitment: 'confirmed' });
 * } catch (e) {
 *     if (isSolanaError(e, SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND)) {
 *         console.error(
 *             'The lifetime specified by this transaction refers to a nonce account ' +
 *                 `\`${e.context.nonceAccountAddress}\` that does not exist`,
 *         );
 *     } else if (isSolanaError(e, SOLANA_ERROR__INVALID_NONCE)) {
 *         console.error('This transaction depends on a nonce that is no longer valid');
 *     } else {
 *         throw e;
 *     }
 * }
 * ```
 */
export function sendAndConfirmDurableNonceTransactionFactory({
    rpc,
    rpcSubscriptions,
}: SendAndConfirmDurableNonceTransactionFactoryConfig<'devnet'>): SendAndConfirmDurableNonceTransactionFunction;
export function sendAndConfirmDurableNonceTransactionFactory({
    rpc,
    rpcSubscriptions,
}: SendAndConfirmDurableNonceTransactionFactoryConfig<'testnet'>): SendAndConfirmDurableNonceTransactionFunction;
export function sendAndConfirmDurableNonceTransactionFactory({
    rpc,
    rpcSubscriptions,
}: SendAndConfirmDurableNonceTransactionFactoryConfig<'mainnet'>): SendAndConfirmDurableNonceTransactionFunction;
export function sendAndConfirmDurableNonceTransactionFactory<
    TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void,
>({
    rpc,
    rpcSubscriptions,
}: SendAndConfirmDurableNonceTransactionFactoryConfig<TCluster>): SendAndConfirmDurableNonceTransactionFunction {
    const getNonceInvalidationPromise = createNonceInvalidationPromiseFactory({ rpc, rpcSubscriptions } as Parameters<
        typeof createNonceInvalidationPromiseFactory
    >[0]);
    const getRecentSignatureConfirmationPromise = createRecentSignatureConfirmationPromiseFactory({
        rpc,
        rpcSubscriptions,
    } as Parameters<typeof createRecentSignatureConfirmationPromiseFactory>[0]);

    /**
     * Creates a wrapped version of getNonceInvalidationPromise that handles the race condition
     * where the nonce account update notification arrives before the signature confirmation.
     *
     * When the nonce changes, we check if our transaction actually landed on-chain.
     * If it did, we don't throw - letting the signature confirmation promise continue.
     */
    function createNonceInvalidationPromiseHandlingRaceCondition(
        signature: Signature,
    ): typeof getNonceInvalidationPromise {
        return async function wrappedGetNonceInvalidationPromise(config) {
            try {
                return await getNonceInvalidationPromise(config);
            } catch (e) {
                // If nonce became invalid, check if our transaction actually landed
                if (isSolanaError(e, SOLANA_ERROR__INVALID_NONCE)) {
                    const { value: statuses } = await rpc
                        .getSignatureStatuses([signature])
                        .send({ abortSignal: config.abortSignal });
                    const status = statuses[0];

                    if (status === null) {
                        // Transaction doesn't exist - nonce was truly invalid
                        throw e;
                    }

                    // Check if status meets required commitment
                    if (
                        status.confirmationStatus !== null &&
                        commitmentComparator(status.confirmationStatus, config.commitment) >= 0
                    ) {
                        // Transaction failed on-chain, throw the error from the transaction
                        if (status.err !== null) {
                            throw getSolanaErrorFromTransactionError(status.err);
                        }
                        // Transaction succeeded, resolve the promise successfully
                        return;
                    }

                    // Commitment not met yet - return a never-resolving promise
                    // This lets the signature confirmation promise continue
                    return await new Promise(() => {});
                }
                throw e;
            }
        };
    }

    async function confirmDurableNonceTransaction(
        config: Omit<
            Parameters<typeof waitForDurableNonceTransactionConfirmation>[0],
            'getNonceInvalidationPromise' | 'getRecentSignatureConfirmationPromise'
        >,
    ) {
        const wrappedGetNonceInvalidationPromise = createNonceInvalidationPromiseHandlingRaceCondition(
            getSignatureFromTransaction(config.transaction),
        );

        await waitForDurableNonceTransactionConfirmation({
            ...config,
            getNonceInvalidationPromise: wrappedGetNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
        });
    }
    return async function sendAndConfirmDurableNonceTransaction(transaction, config) {
        await sendAndConfirmDurableNonceTransaction_INTERNAL_ONLY_DO_NOT_EXPORT({
            ...config,
            confirmDurableNonceTransaction,
            rpc,
            transaction,
        });
    };
}
