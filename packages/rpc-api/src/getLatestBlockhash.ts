import type { Blockhash, Commitment, Slot, SolanaRpcResponse } from '@solana/rpc-types';

type GetLatestBlockhashApiResponse = Readonly<{
    /** A SHA-256 hash as base-58 encoded string */
    blockhash: Blockhash;
    /**
     * Last block height at which the blockhash will be considered a valid lifetime specifier with
     * which to land a transaction.
     *
     * @see {@link setTransactionMessageLifetimeUsingBlockhash}
     */
    lastValidBlockHeight: bigint;
}>;

export type GetLatestBlockhashApi = {
    /**
     * Returns the blockhash of the latest block.
     *
     * @see https://solana.com/docs/rpc/http/getlatestblockhash
     */
    getLatestBlockhash(
        config?: Readonly<{
            /**
             * Fetch the latest blockhash as of the highest slot that has reached this level of
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
    ): SolanaRpcResponse<GetLatestBlockhashApiResponse>;
};
