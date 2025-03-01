/* eslint-disable sort-keys-fix/sort-keys-fix */
/* eslint-disable typescript-sort-keys/interface */
import type { GetEpochInfoApi, GetSignatureStatusesApi, Rpc, SendTransactionApi } from '@solana/rpc';
import {
    createBlockHeightExceedenceByPollingPromiseFactory,
    createRecentSignatureConfirmationByPollingPromiseFactory,
    waitForRecentTransactionConfirmation,
} from '@solana/transaction-confirmation';
import { FullySignedTransaction, TransactionWithBlockhashLifetime } from '@solana/transactions';

import { sendAndConfirmTransactionWithBlockhashLifetime_INTERNAL_ONLY_DO_NOT_EXPORT } from './send-transaction-internal';

type SendAndPollToConfirmTransactionWithBlockhashLifetimeFunction = (
    transaction: FullySignedTransaction & TransactionWithBlockhashLifetime,
    config: Omit<
        Parameters<typeof sendAndConfirmTransactionWithBlockhashLifetime_INTERNAL_ONLY_DO_NOT_EXPORT>[0],
        'confirmRecentTransaction' | 'rpc' | 'transaction'
    >,
) => Promise<void>;

type SendAndPollToConfirmTransactionWithBlockhashLifetimeFactoryConfig<TCluster> = {
    rpc: Rpc<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi> & { '~cluster'?: TCluster };
    pollingInterval?: number;
};

export function sendAndPollToConfirmTransactionFactory({
    rpc,
    pollingInterval,
}: SendAndPollToConfirmTransactionWithBlockhashLifetimeFactoryConfig<'devnet'>): SendAndPollToConfirmTransactionWithBlockhashLifetimeFunction;
export function sendAndPollToConfirmTransactionFactory({
    rpc,
    pollingInterval,
}: SendAndPollToConfirmTransactionWithBlockhashLifetimeFactoryConfig<'testnet'>): SendAndPollToConfirmTransactionWithBlockhashLifetimeFunction;
export function sendAndPollToConfirmTransactionFactory({
    rpc,
    pollingInterval,
}: SendAndPollToConfirmTransactionWithBlockhashLifetimeFactoryConfig<'mainnet'>): SendAndPollToConfirmTransactionWithBlockhashLifetimeFunction;
export function sendAndPollToConfirmTransactionFactory<
    TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void,
>({
    rpc,
    pollingInterval,
}: SendAndPollToConfirmTransactionWithBlockhashLifetimeFactoryConfig<TCluster>): SendAndPollToConfirmTransactionWithBlockhashLifetimeFunction {
    const getBlockHeightExceedencePromise = createBlockHeightExceedenceByPollingPromiseFactory({
        rpc,
        pollingInterval,
    } as Parameters<typeof createBlockHeightExceedenceByPollingPromiseFactory>[0]);
    const getRecentSignatureConfirmationPromise = createRecentSignatureConfirmationByPollingPromiseFactory({
        rpc,
        pollingInterval,
    } as Parameters<typeof createRecentSignatureConfirmationByPollingPromiseFactory>[0]);
    async function pollToConfirmRecentTransaction(
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
    return async function sendAndPollToConfirmTransaction(transaction, config) {
        await sendAndConfirmTransactionWithBlockhashLifetime_INTERNAL_ONLY_DO_NOT_EXPORT({
            ...config,
            confirmRecentTransaction: pollToConfirmRecentTransaction,
            rpc,
            transaction,
        });
    };
}
