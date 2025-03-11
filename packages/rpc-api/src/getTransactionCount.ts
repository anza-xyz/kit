import type { Commitment, Slot } from '@solana/rpc-types';

type GetTransactionCountApiResponse = bigint;

export type GetTransactionCountApi = {
    /**
     * Returns the current Transaction count from the ledger
     */
    getTransactionCount(
        config?: Readonly<{
            /**
             * Fetch the transaction count as of the highest slot that has reached this level of
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
    ): GetTransactionCountApiResponse;
};
