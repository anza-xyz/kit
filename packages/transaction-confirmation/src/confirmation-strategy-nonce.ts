import type { Address } from '@solana/addresses';
import { getBase58Decoder, getBase64Encoder } from '@solana/codecs-strings';
import { SOLANA_ERROR__INVALID_NONCE, SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND, SolanaError } from '@solana/errors';
import { AbortController } from '@solana/event-target-impl';
import { safeRace } from '@solana/promises';
import type { GetAccountInfoApi, Rpc } from '@solana/rpc';
import type { AccountNotificationsApi, RpcSubscriptions } from '@solana/rpc-subscriptions';
import type { Base64EncodedDataResponse, Commitment } from '@solana/rpc-types';
import { Nonce } from '@solana/transaction-messages';

type GetNonceInvalidationPromiseFn = (config: {
    abortSignal: AbortSignal;
    /**
     * Fetch the nonce account details as of the highest slot that has reached this level of
     * commitment.
     */
    commitment: Commitment;
    /**
     * The value of the nonce that we would expect to see in the nonce account in order for any
     * transaction with that nonce-based lifetime to be considered valid.
     */
    currentNonceValue: Nonce;
    /** The address of the account in which the currently-valid nonce value is stored */
    nonceAccountAddress: Address;
}) => Promise<void>;

type CreateNonceInvalidationPromiseFactoryConfig<TCluster> = {
    rpc: Rpc<GetAccountInfoApi> & { '~cluster'?: TCluster };
    rpcSubscriptions: RpcSubscriptions<AccountNotificationsApi> & { '~cluster'?: TCluster };
};

const NONCE_VALUE_OFFSET =
    4 + // version(u32)
    4 + // state(u32)
    32; // nonce authority(pubkey)
// Then comes the nonce value.

/**
 * Creates a promise that throws when the value stored in a nonce account is not the expected one.
 *
 * When a transaction's lifetime is tied to the value stored in a nonce account, that transaction
 * can be landed on the network until the nonce is advanced to a new value.
 *
 * @param config
 *
 * @example
 * ```ts
 * import { isSolanaError, SolanaError } from '@solana/errors';
 * import { createNonceInvalidationPromiseFactory } from '@solana/transaction-confirmation';
 *
 * const getNonceInvalidationPromise = createNonceInvalidationPromiseFactory({
 *     rpc,
 *     rpcSubscriptions,
 * });
 * try {
 *     await getNonceInvalidationPromise({
 *         currentNonceValue,
 *         nonceAccountAddress,
 *     });
 * } catch (e) {
 *     if (isSolanaError(e, SOLANA_ERROR__NONCE_INVALID)) {
 *         console.error(`The nonce has advanced to ${e.context.actualNonceValue}`);
 *         // Re-sign and retry the transaction.
 *         return;
 *     } else if (isSolanaError(e, SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND)) {
 *         console.error(`No nonce account was found at ${nonceAccountAddress}`);
 *     }
 *     throw e;
 * }
 * ```
 */
export function createNonceInvalidationPromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateNonceInvalidationPromiseFactoryConfig<'devnet'>): GetNonceInvalidationPromiseFn;
export function createNonceInvalidationPromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateNonceInvalidationPromiseFactoryConfig<'testnet'>): GetNonceInvalidationPromiseFn;
export function createNonceInvalidationPromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateNonceInvalidationPromiseFactoryConfig<'mainnet'>): GetNonceInvalidationPromiseFn;
export function createNonceInvalidationPromiseFactory<TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void>({
    rpc,
    rpcSubscriptions,
}: CreateNonceInvalidationPromiseFactoryConfig<TCluster>): GetNonceInvalidationPromiseFn {
    return async function getNonceInvalidationPromise({
        abortSignal: callerAbortSignal,
        commitment,
        currentNonceValue: expectedNonceValue,
        nonceAccountAddress,
    }) {
        const abortController = new AbortController();
        function handleAbort() {
            abortController.abort();
        }
        callerAbortSignal.addEventListener('abort', handleAbort, { signal: abortController.signal });
        /**
         * STEP 1: Set up a subscription for nonce account changes.
         */
        const accountNotifications = await rpcSubscriptions
            .accountNotifications(nonceAccountAddress, { commitment, encoding: 'base64' })
            .subscribe({ abortSignal: abortController.signal });
        const base58Decoder = getBase58Decoder();
        const base64Encoder = getBase64Encoder();
        function getNonceFromAccountData([base64EncodedBytes]: Base64EncodedDataResponse): Nonce {
            const data = base64Encoder.encode(base64EncodedBytes);
            const nonceValueBytes = data.slice(NONCE_VALUE_OFFSET, NONCE_VALUE_OFFSET + 32);
            return base58Decoder.decode(nonceValueBytes) as Nonce;
        }
        const nonceAccountDidAdvancePromise = (async () => {
            for await (const accountNotification of accountNotifications) {
                const nonceValue = getNonceFromAccountData(accountNotification.value.data);
                if (nonceValue !== expectedNonceValue) {
                    throw new SolanaError(SOLANA_ERROR__INVALID_NONCE, {
                        actualNonceValue: nonceValue,
                        expectedNonceValue,
                    });
                }
            }
        })();
        /**
         * STEP 2: Having subscribed for updates, make a one-shot request for the current nonce
         *         value to check if it has already been advanced.
         */
        const nonceIsAlreadyInvalidPromise = (async () => {
            const { value: nonceAccount } = await rpc
                .getAccountInfo(nonceAccountAddress, {
                    commitment,
                    dataSlice: { length: 32, offset: NONCE_VALUE_OFFSET },
                    encoding: 'base58',
                })
                .send({ abortSignal: abortController.signal });
            if (!nonceAccount) {
                throw new SolanaError(SOLANA_ERROR__NONCE_ACCOUNT_NOT_FOUND, {
                    nonceAccountAddress,
                });
            }
            const nonceValue =
                // This works because we asked for the exact slice of data representing the nonce
                // value, and furthermore asked for it in `base58` encoding.
                nonceAccount.data[0] as unknown as Nonce;
            if (nonceValue !== expectedNonceValue) {
                throw new SolanaError(SOLANA_ERROR__INVALID_NONCE, {
                    actualNonceValue: nonceValue,
                    expectedNonceValue,
                });
            } else {
                await new Promise(() => {
                    /* never resolve */
                });
            }
        })();
        try {
            return await safeRace([nonceAccountDidAdvancePromise, nonceIsAlreadyInvalidPromise]);
        } finally {
            abortController.abort();
        }
    };
}
