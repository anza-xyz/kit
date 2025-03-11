import type { Address } from '@solana/addresses';
import type { Commitment, Slot } from '@solana/rpc-types';

type GetSlotLeaderApiResponse = Address;

export type GetSlotLeaderApi = {
    /**
     * Returns the current slot leader
     */
    getSlotLeader(
        config?: Readonly<{
            /**
             * Fetch the leader as of the highest slot that has reached this level of commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
            minContextSlot?: Slot;
        }>,
    ): GetSlotLeaderApiResponse;
};
