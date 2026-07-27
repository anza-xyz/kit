import type { Signature } from '@solana/keys';
import { safeRace } from '@solana/promises';
import type { GetSignatureStatusesApi, RequestAirdropApi, Rpc } from '@solana/rpc';
import type { RpcSubscriptions, SignatureNotificationsApi } from '@solana/rpc-subscriptions';
import type { Commitment } from '@solana/rpc-types';
import {
    createRecentSignatureConfirmationPromiseFactory,
    getTimeoutPromise,
} from '@solana/transaction-confirmation';

import { requestAndConfirmAirdrop_INTERNAL_ONLY_DO_NOT_EXPORT } from './airdrop-internal';

type AirdropFunction = (
    config: Omit<
        Parameters<typeof requestAndConfirmAirdrop_INTERNAL_ONLY_DO_NOT_EXPORT>[0],
        'confirmSignatureOnlyTransaction' | 'rpc'
    >,
) => Promise<Signature>;

type AirdropFactoryConfig<TCluster> = {
    /** An object that supports the {@link GetSignatureStatusesApi} and the {@link RequestAirdropApi} of the Solana RPC API */
    rpc: Rpc<GetSignatureStatusesApi & RequestAirdropApi> & { '~cluster'?: TCluster };
    /** An object that supports the {@link SignatureNotificationsApi} of the Solana RPC Subscriptions API */
    rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi> & { '~cluster'?: TCluster };
};

/**
 * Returns a function that you can call to airdrop a certain amount of {@link Lamports} to a Solana
 * address.
 *
 * > [!NOTE] This only works on test clusters.
 *
 * @param config
 *
 * @example
 * ```ts
 * import { address, airdropFactory, createSolanaRpc, createSolanaRpcSubscriptions, devnet, lamports } from '@solana/kit';
 *
 * const rpc = createSolanaRpc(devnet('http://127.0.0.1:8899'));
 * const rpcSubscriptions = createSolanaRpcSubscriptions(devnet('ws://127.0.0.1:8900'));
 *
 * const airdrop = airdropFactory({ rpc, rpcSubscriptions });
 *
 * await airdrop({
 *     commitment: 'confirmed',
 *     recipientAddress: address('FnHyam9w4NZoWR6mKN1CuGBritdsEWZQa4Z4oawLZGxa'),
 *     lamports: lamports(10_000_000n),
 * });
 * ```
 */
export function airdropFactory({ rpc, rpcSubscriptions }: AirdropFactoryConfig<'devnet'>): AirdropFunction;
export function airdropFactory({ rpc, rpcSubscriptions }: AirdropFactoryConfig<'mainnet'>): AirdropFunction;
export function airdropFactory({ rpc, rpcSubscriptions }: AirdropFactoryConfig<'testnet'>): AirdropFunction;
export function airdropFactory<TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void>({
    rpc,
    rpcSubscriptions,
}: AirdropFactoryConfig<TCluster>): AirdropFunction {
    const getRecentSignatureConfirmationPromise = createRecentSignatureConfirmationPromiseFactory({
        rpc,
        rpcSubscriptions,
    } as Parameters<typeof createRecentSignatureConfirmationPromiseFactory>[0]);
    async function confirmSignatureOnlyTransaction({
        abortSignal,
        commitment,
        signature,
    }: Readonly<{
        abortSignal?: AbortSignal;
        commitment: Commitment;
        signature: Signature;
    }>) {
        abortSignal?.throwIfAborted();
        const abortController = new AbortController();
        if (abortSignal) {
            const handleAbort = () => {
                abortController.abort();
            };
            abortSignal.addEventListener('abort', handleAbort, { signal: abortController.signal });
        }
        try {
            await safeRace([
                getRecentSignatureConfirmationPromise({
                    abortSignal: abortController.signal,
                    commitment,
                    signature,
                }),
                getTimeoutPromise({
                    abortSignal: abortController.signal,
                    commitment,
                }),
            ]);
        } finally {
            abortController.abort();
        }
    }
    return async function airdrop(config) {
        return await requestAndConfirmAirdrop_INTERNAL_ONLY_DO_NOT_EXPORT({
            ...config,
            confirmSignatureOnlyTransaction,
            rpc,
        });
    };
}
