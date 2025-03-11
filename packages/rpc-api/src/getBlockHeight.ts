import type { Commitment, Slot } from '@solana/rpc-types';

type GetBlockHeightApiResponse = bigint;

export type GetBlockHeightApi = {
    /**
     * Returns the current block height of the node
     */
    getBlockHeight(
        config?: Readonly<{
            /**
             * Fetch the block height as of the highest slot that has reached this level of
             * commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
            // The minimum slot that the request can be evaluated at
            minContextSlot?: Slot;
        }>,
    ): GetBlockHeightApiResponse;
};
