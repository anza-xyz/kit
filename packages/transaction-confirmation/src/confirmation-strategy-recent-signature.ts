import { getSolanaErrorFromTransactionError } from '@solana/errors';
import { AbortController } from '@solana/event-target-impl';
import type { Signature } from '@solana/keys';
import { safeRace } from '@solana/promises';
import type { GetSignatureStatusesApi, Rpc } from '@solana/rpc';
import type { RpcSubscriptions, SignatureNotificationsApi } from '@solana/rpc-subscriptions';
import { type Commitment, commitmentComparator } from '@solana/rpc-types';

type GetRecentSignatureConfirmationPromiseFn = (config: {
    abortSignal: AbortSignal;
    /**
     * The level of commitment the transaction must have achieved in order for the promise to
     * resolve.
     */
    commitment: Commitment;
    /**
     * A 64 byte Ed25519 signature, encoded as a base-58 string, that uniquely identifies a
     * transaction by virtue of being the first or only signature in its list of signatures.
     */
    signature: Signature;
}) => Promise<void>;

type CreateRecentSignatureConfirmationPromiseFactoryConfig<TCluster> = {
    rpc: Rpc<GetSignatureStatusesApi> & { '~cluster'?: TCluster };
    rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi> & { '~cluster'?: TCluster };
};

/**
 * Creates a promise that resolves when a recently-landed transaction achieves the target
 * confirmation commitment, and throws when the transaction fails with an error.
 *
 * The status of recently-landed transactions is available in the network's status cache. This
 * confirmation strategy will only yield a result if the signature is still in the status cache. To
 * fetch the status of transactions older than those available in the status cache, use the
 * {@link GetSignatureStatusesApi.getSignatureStatuses} method setting the
 * `searchTransactionHistory` configuration param to `true`.
 *
 * @param config
 *
 * @example
 * ```ts
 * import { createRecentSignatureConfirmationPromiseFactory } from '@solana/transaction-confirmation';
 *
 * const getRecentSignatureConfirmationPromise = createRecentSignatureConfirmationPromiseFactory({
 *     rpc,
 *     rpcSubscriptions,
 * });
 * try {
 *     await getRecentSignatureConfirmationPromise({
 *         commitment,
 *         signature,
 *     });
 *     console.log(`The transaction with signature \`${signature}\` has achieved a commitment level of \`${commitment}\``);
 * } catch (e) {
 *     console.error(`The transaction with signature \`${signature}\` failed`, e.cause);
 *     throw e;
 * }
 * ```
 */
export function createRecentSignatureConfirmationPromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateRecentSignatureConfirmationPromiseFactoryConfig<'devnet'>): GetRecentSignatureConfirmationPromiseFn;
export function createRecentSignatureConfirmationPromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateRecentSignatureConfirmationPromiseFactoryConfig<'testnet'>): GetRecentSignatureConfirmationPromiseFn;
export function createRecentSignatureConfirmationPromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateRecentSignatureConfirmationPromiseFactoryConfig<'mainnet'>): GetRecentSignatureConfirmationPromiseFn;
export function createRecentSignatureConfirmationPromiseFactory<
    TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void,
>({
    rpc,
    rpcSubscriptions,
}: CreateRecentSignatureConfirmationPromiseFactoryConfig<TCluster>): GetRecentSignatureConfirmationPromiseFn {
    return async function getRecentSignatureConfirmationPromise({
        abortSignal: callerAbortSignal,
        commitment,
        signature,
    }) {
        const abortController = new AbortController();
        function handleAbort() {
            abortController.abort();
        }
        callerAbortSignal.addEventListener('abort', handleAbort, { signal: abortController.signal });
        /**
         * STEP 1: Set up a subscription for status changes to a signature.
         */
        const signatureStatusNotifications = await rpcSubscriptions
            .signatureNotifications(signature, { commitment })
            .subscribe({ abortSignal: abortController.signal });
        const signatureDidCommitPromise = (async () => {
            for await (const signatureStatusNotification of signatureStatusNotifications) {
                if (signatureStatusNotification.value.err) {
                    throw getSolanaErrorFromTransactionError(signatureStatusNotification.value.err);
                } else {
                    return;
                }
            }
        })();
        /**
         * STEP 2: Having subscribed for updates, make a one-shot request for the current status.
         *         This will only yield a result if the signature is still in the status cache.
         */
        const signatureStatusLookupPromise = (async () => {
            const { value: signatureStatusResults } = await rpc
                .getSignatureStatuses([signature])
                .send({ abortSignal: abortController.signal });
            const signatureStatus = signatureStatusResults[0];
            if (
                signatureStatus &&
                signatureStatus.confirmationStatus &&
                commitmentComparator(signatureStatus.confirmationStatus, commitment) >= 0
            ) {
                return;
            } else {
                await new Promise(() => {
                    /* never resolve */
                });
            }
        })();
        try {
            return await safeRace([signatureDidCommitPromise, signatureStatusLookupPromise]);
        } finally {
            abortController.abort();
        }
    };
}
