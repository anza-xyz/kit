import type { Commitment, Slot } from '@solana/rpc-types';

type GetBlocksWithLimitApiResponse = Slot[];

export type GetBlocksWithLimitApi = {
    /**
     * Returns a list of confirmed blocks starting at the given slot (inclusive). Returns up to the
     * number of blocks specified by the limit.
     *
     * @see https://solana.com/docs/rpc/http/getblockswithlimit
     */
    getBlocksWithLimit(
        /** The first slot for which to return a confirmed block */
        startSlot: Slot,
        /**
         * The maximum number of blocks to return (between 0 and 500,000).
         *
         * Specifying 0 will result in an empty array being returned.
         */
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
