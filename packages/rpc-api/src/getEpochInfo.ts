import type { Commitment, Slot } from '@solana/rpc-types';

type GetEpochInfoApiResponse = Readonly<{
    /** the current slot */
    absoluteSlot: Slot;
    /** the current block height */
    blockHeight: bigint;
    /** the current epoch */
    epoch: bigint;
    /** the current slot relative to the start of the current epoch */
    slotIndex: bigint;
    /** the number of slots in this epoch */
    slotsInEpoch: bigint;
    /** total number of transactions processed without error since genesis */
    transactionCount: bigint | null;
}>;

export type GetEpochInfoApi = {
    /**
     * Returns the balance of the account of provided Pubkey
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
            minContextSlot?: Slot;
        }>,
    ): GetEpochInfoApiResponse;
};
