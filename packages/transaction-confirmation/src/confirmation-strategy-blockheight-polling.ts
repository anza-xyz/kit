import { SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, SolanaError } from '@solana/errors';
import { AbortController } from '@solana/event-target-impl';
import { getAbortablePromise, safeRace } from '@solana/promises';
import type { GetEpochInfoApi, Rpc } from '@solana/rpc';
import type { Commitment } from '@solana/rpc-types';

type GetBlockHeightExceedenceByPollingPromiseFn = (config: {
    abortSignal: AbortSignal;
    commitment?: Commitment;
    lastValidBlockHeight: bigint;
    pollingInterval?: number;
}) => Promise<void>;

type CreateBlockHeightExceedenceByPollingPromiseFactoryConfig<TCluster> = {
    defaultPollingInterval?: number;
    rpc: Rpc<GetEpochInfoApi> & { '~cluster'?: TCluster };
};

export function createBlockHeightExceedenceByPollingPromiseFactory({
    rpc,
    defaultPollingInterval,
}: CreateBlockHeightExceedenceByPollingPromiseFactoryConfig<'devnet'>): GetBlockHeightExceedenceByPollingPromiseFn;
export function createBlockHeightExceedenceByPollingPromiseFactory({
    rpc,
    defaultPollingInterval,
}: CreateBlockHeightExceedenceByPollingPromiseFactoryConfig<'testnet'>): GetBlockHeightExceedenceByPollingPromiseFn;
export function createBlockHeightExceedenceByPollingPromiseFactory({
    rpc,
    defaultPollingInterval,
}: CreateBlockHeightExceedenceByPollingPromiseFactoryConfig<'mainnet'>): GetBlockHeightExceedenceByPollingPromiseFn;
export function createBlockHeightExceedenceByPollingPromiseFactory<
    TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void,
>({
    rpc,
    defaultPollingInterval = 1000,
}: CreateBlockHeightExceedenceByPollingPromiseFactoryConfig<TCluster>): GetBlockHeightExceedenceByPollingPromiseFn {
    return async function getBlockHeightExceedenceByPollingPromise({
        abortSignal: callerAbortSignal,
        commitment,
        lastValidBlockHeight,
        pollingInterval = defaultPollingInterval,
    }): Promise<never> {
        callerAbortSignal.throwIfAborted();
        const abortController = new AbortController();
        const handleAbort = () => {
            abortController.abort();
        };
        callerAbortSignal.addEventListener('abort', handleAbort, { signal: abortController.signal });

        async function getBlockHeight() {
            const { blockHeight } = await rpc
                .getEpochInfo({ commitment })
                .send({ abortSignal: abortController.signal });
            return blockHeight;
        }

        try {
            let currentBlockHeight = await getAbortablePromise(getBlockHeight(), abortController.signal);

            while (currentBlockHeight <= lastValidBlockHeight) {
                await safeRace([
                    new Promise(resolve => setTimeout(resolve, pollingInterval)),
                    new Promise((_, reject) => {
                        callerAbortSignal.addEventListener('abort', () => {
                            const reason = callerAbortSignal.reason;
                            reject(reason instanceof Error ? reason : new Error(String(reason)));
                        });
                    }),
                ]);

                currentBlockHeight = await getAbortablePromise(getBlockHeight(), abortController.signal);
            }

            callerAbortSignal.throwIfAborted();
            throw new SolanaError(SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, {
                currentBlockHeight,
                lastValidBlockHeight,
            });
        } finally {
            callerAbortSignal.removeEventListener('abort', handleAbort);
            abortController.abort();
        }
    };
}
