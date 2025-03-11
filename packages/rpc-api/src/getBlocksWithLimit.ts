import type { Commitment, Slot } from '@solana/rpc-types';

type GetBlocksWithLimitApiResponse = Slot[];

export type GetBlocksWithLimitApi = {
    /**
     * Returns a list of confirmed blocks starting at the given slot
     * for up to `limit` blocks
     */
    getBlocksWithLimit(
        startSlot: Slot,
        // The maximum number of blocks to return (between 0 and 500,000)
        // Note: 0 will return an empty array
        limit: number,
        config?: Readonly<{
            /**
             * Include only blocks at slots that have reached at least this level of commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Exclude<Commitment, 'processed'>;
        }>,
    ): GetBlocksWithLimitApiResponse;
};
