import type { Commitment, Slot } from '@solana/rpc-types';

type GetEpochInfoApiResponse = Readonly<{
    /** The current slot */
    absoluteSlot: Slot;
    /** The current block height */
    blockHeight: bigint;
    /** The current epoch */
    epoch: bigint;
    /** The current slot relative to the start of the current epoch */
    slotIndex: bigint;
    /** The number of slots in this epoch */
    slotsInEpoch: bigint;
    /** Total number of transactions processed without error since genesis */
    transactionCount: bigint | null;
}>;

export type GetEpochInfoApi = {
    /**
     * Returns information about the current epoch.
     *
     * @see https://solana.com/docs/rpc/http/getepochinfo
     */
    getEpochInfo(
        config?: Readonly<{
            /**
             * Fetch epoch information as of the highest slot that has reached this level of
             * commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
            /**
             * Prevents accessing stale data by enforcing that the RPC node has processed
             * transactions up to this slot
             */
            minContextSlot?: Slot;
        }>,
    ): GetEpochInfoApiResponse;
};
