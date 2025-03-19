import type { Commitment, Slot } from '@solana/rpc-types';

type GetBlocksApiResponse = Slot[];

export type GetBlocksApi = {
    /**
     * Returns a list of confirmed blocks between two slots (inclusive).
     *
     * @see https://solana.com/docs/rpc/http/getblocks
     */
    getBlocks(
        /** The first slot for which to return a confirmed block */
        startSlotInclusive: Slot,
        /**
         * The last slot for which to return a confirmed block.
         *
         * Must be no more than 500,000 blocks higher than the start slot.
         *
         * @defaultValue If not provided, defaults to the latest confirmed slot.
         */
        endSlotInclusive?: Slot,
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
    ): GetBlocksApiResponse;
};
