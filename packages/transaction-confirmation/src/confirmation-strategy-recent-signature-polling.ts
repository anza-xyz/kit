/* eslint-disable typescript-sort-keys/interface */
import { getSolanaErrorFromTransactionError } from '@solana/errors';
import { AbortController } from '@solana/event-target-impl';
import type { Signature } from '@solana/keys';
import { getAbortablePromise, safeRace } from '@solana/promises';
import type { GetSignatureStatusesApi, Rpc } from '@solana/rpc';
import { type Commitment, commitmentComparator } from '@solana/rpc-types';

type GetRecentSignatureConfirmationByPollingPromiseFn = (config: {
    abortSignal: AbortSignal;
    commitment: Commitment;
    signature: Signature;
    pollingInterval?: number;
}) => Promise<void>;

type CreateRecentSignatureConfirmationByPollingPromiseFactoryConfig<TCluster> = {
    rpc: Rpc<GetSignatureStatusesApi> & { '~cluster'?: TCluster };
    defaultPollingInterval?: number;
};

export function createRecentSignatureConfirmationByPollingPromiseFactory({
    rpc,
    defaultPollingInterval,
}: CreateRecentSignatureConfirmationByPollingPromiseFactoryConfig<'devnet'>): GetRecentSignatureConfirmationByPollingPromiseFn;
export function createRecentSignatureConfirmationByPollingPromiseFactory({
    rpc,
    defaultPollingInterval,
}: CreateRecentSignatureConfirmationByPollingPromiseFactoryConfig<'testnet'>): GetRecentSignatureConfirmationByPollingPromiseFn;
export function createRecentSignatureConfirmationByPollingPromiseFactory({
    rpc,
    defaultPollingInterval,
}: CreateRecentSignatureConfirmationByPollingPromiseFactoryConfig<'mainnet'>): GetRecentSignatureConfirmationByPollingPromiseFn;
export function createRecentSignatureConfirmationByPollingPromiseFactory<
    TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void,
>({
    rpc,
    defaultPollingInterval = 1000,
}: CreateRecentSignatureConfirmationByPollingPromiseFactoryConfig<TCluster>): GetRecentSignatureConfirmationByPollingPromiseFn {
    return async function getRecentSignatureConfirmationByPollingPromise({
        abortSignal: callerAbortSignal,
        commitment,
        signature,
        pollingInterval = defaultPollingInterval,
    }) {
        const abortController = new AbortController();
        function handleAbort() {
            abortController.abort();
        }
        callerAbortSignal.addEventListener('abort', handleAbort, { signal: abortController.signal });

        try {
            while (true) {
                const { value: signatureStatusResults } = await getAbortablePromise(
                    rpc.getSignatureStatuses([signature]).send(),
                    abortController.signal,
                );

                const signatureStatus = signatureStatusResults[0];

                if (signatureStatus?.err) {
                    throw getSolanaErrorFromTransactionError(signatureStatus.err);
                }

                if (
                    signatureStatus &&
                    signatureStatus.confirmationStatus &&
                    commitmentComparator(signatureStatus.confirmationStatus, commitment) >= 0
                ) {
                    return;
                }

                await safeRace([
                    new Promise(resolve => setTimeout(resolve, pollingInterval)),
                    new Promise((_, reject) => {
                        callerAbortSignal.addEventListener('abort', () => {
                            const reason = callerAbortSignal.reason;
                            reject(reason instanceof Error ? reason : new Error(String(reason)));
                        });
                    }),
                ]);
            }
        } finally {
            callerAbortSignal.removeEventListener('abort', handleAbort);
            abortController.abort();
        }
    };
}
