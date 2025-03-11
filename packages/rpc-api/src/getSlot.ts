import type { Commitment, Slot } from '@solana/rpc-types';

type GetSlotApiResponse = Slot;

export type GetSlotApi = {
    /**
     * Returns the slot that has reached the given or default commitment level
     */
    getSlot(
        config?: Readonly<{
            /**
             * Fetch the highest slot that has reached this level of commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
            minContextSlot?: Slot;
        }>,
    ): GetSlotApiResponse;
};
