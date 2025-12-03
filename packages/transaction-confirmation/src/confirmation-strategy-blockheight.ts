import { SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, SolanaError } from '@solana/errors';
import { AbortController } from '@solana/event-target-impl';
import type { GetEpochInfoApi, Rpc } from '@solana/rpc';
import type { RpcSubscriptions, SlotNotificationsApi } from '@solana/rpc-subscriptions';
import type { Commitment } from '@solana/rpc-types';

type GetBlockHeightExceedencePromiseFn = (config: {
    abortSignal: AbortSignal;
    /**
     * Fetch the block height as of the highest slot that has reached this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    /** The block height after which to reject the promise */
    lastValidBlockHeight: bigint;
}) => Promise<void>;

type CreateBlockHeightExceedencePromiseFactoryConfig<TCluster> = {
    rpc: Rpc<GetEpochInfoApi> & { '~cluster'?: TCluster };
    rpcSubscriptions: RpcSubscriptions<SlotNotificationsApi> & { '~cluster'?: TCluster };
};

/**
 * Creates a promise that throws when the network progresses past the block height after which the
 * supplied blockhash is considered expired for use as a transaction lifetime specifier.
 *
 * When a transaction's lifetime is tied to a blockhash, that transaction can be landed on the
 * network until that blockhash expires. All blockhashes have a block height after which they are
 * considered to have expired.
 *
 * @param config
 *
 * @example
 * ```ts
 * import { isSolanaError, SolanaError } from '@solana/errors';
 * import { createBlockHeightExceedencePromiseFactory } from '@solana/transaction-confirmation';
 *
 * const getBlockHeightExceedencePromise = createBlockHeightExceedencePromiseFactory({
 *     rpc,
 *     rpcSubscriptions,
 * });
 * try {
 *     await getBlockHeightExceedencePromise({ lastValidBlockHeight });
 * } catch (e) {
 *     if (isSolanaError(e, SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED)) {
 *         console.error(
 *             `The block height of the network has exceeded ${e.context.lastValidBlockHeight}. ` +
 *                 `It is now ${e.context.currentBlockHeight}`,
 *         );
 *         // Re-sign and retry the transaction.
 *         return;
 *     }
 *     throw e;
 * }
 * ```
 */
export function createBlockHeightExceedencePromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateBlockHeightExceedencePromiseFactoryConfig<'devnet'>): GetBlockHeightExceedencePromiseFn;
export function createBlockHeightExceedencePromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateBlockHeightExceedencePromiseFactoryConfig<'testnet'>): GetBlockHeightExceedencePromiseFn;
export function createBlockHeightExceedencePromiseFactory({
    rpc,
    rpcSubscriptions,
}: CreateBlockHeightExceedencePromiseFactoryConfig<'mainnet'>): GetBlockHeightExceedencePromiseFn;
export function createBlockHeightExceedencePromiseFactory<
    TCluster extends 'devnet' | 'mainnet' | 'testnet' | void = void,
>({
    rpc,
    rpcSubscriptions,
}: CreateBlockHeightExceedencePromiseFactoryConfig<TCluster>): GetBlockHeightExceedencePromiseFn {
    return async function getBlockHeightExceedencePromise({
        abortSignal: callerAbortSignal,
        commitment,
        lastValidBlockHeight,
    }): Promise<never> {
        callerAbortSignal.throwIfAborted();
        const abortController = new AbortController();
        const handleAbort = () => {
            abortController.abort();
        };
        callerAbortSignal.addEventListener('abort', handleAbort, { signal: abortController.signal });
        async function getBlockHeightAndDifferenceBetweenSlotHeightAndBlockHeight() {
            const { absoluteSlot, blockHeight } = await rpc
                .getEpochInfo({ commitment })
                .send({ abortSignal: abortController.signal });
            return {
                blockHeight,
                differenceBetweenSlotHeightAndBlockHeight: absoluteSlot - blockHeight,
            };
        }
        try {
            const [slotNotifications, { blockHeight: initialBlockHeight, differenceBetweenSlotHeightAndBlockHeight }] =
                await Promise.all([
                    rpcSubscriptions.slotNotifications().subscribe({ abortSignal: abortController.signal }),
                    getBlockHeightAndDifferenceBetweenSlotHeightAndBlockHeight(),
                ]);
            callerAbortSignal.throwIfAborted();
            let currentBlockHeight = initialBlockHeight;
            if (currentBlockHeight <= lastValidBlockHeight) {
                let lastKnownDifferenceBetweenSlotHeightAndBlockHeight = differenceBetweenSlotHeightAndBlockHeight;
                for await (const slotNotification of slotNotifications) {
                    const { slot } = slotNotification;
                    if (slot - lastKnownDifferenceBetweenSlotHeightAndBlockHeight > lastValidBlockHeight) {
                        // Before making a final decision, recheck the actual block height.
                        const {
                            blockHeight: recheckedBlockHeight,
                            differenceBetweenSlotHeightAndBlockHeight: currentDifferenceBetweenSlotHeightAndBlockHeight,
                        } = await getBlockHeightAndDifferenceBetweenSlotHeightAndBlockHeight();
                        currentBlockHeight = recheckedBlockHeight;
                        if (currentBlockHeight > lastValidBlockHeight) {
                            // Verified; the block height has been exceeded.
                            break;
                        } else {
                            // The block height has not been exceeded, which implies that the
                            // difference between the slot height and the block height has grown
                            // (ie. some blocks have been skipped since we started). Recalibrate the
                            // difference and keep waiting.
                            lastKnownDifferenceBetweenSlotHeightAndBlockHeight =
                                currentDifferenceBetweenSlotHeightAndBlockHeight;
                        }
                    }
                }
            }
            callerAbortSignal.throwIfAborted();
            throw new SolanaError(SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, {
                currentBlockHeight,
                lastValidBlockHeight,
            });
        } finally {
            abortController.abort();
        }
    };
}
