import type { Blockhash, Commitment, Slot, SolanaRpcResponse } from '@solana/rpc-types';

type IsBlockhashValidApiResponse = boolean;

export type IsBlockhashValidApi = {
    /**
     * Returns whether a blockhash is still valid or not.
     *
     * The last 300 blockhashes produced are considered valid. This equates to an age of ~2 minutes.
     *
     * @param blockhash A SHA-256 hash as base-58 encoded string
     *
     * @see https://solana.com/docs/rpc/http/isblockhashvalid
     */
    isBlockhashValid(
        blockhash: Blockhash,
        config?: Readonly<{
            /**
             * Evaluate whether the blockhash is valid as of the highest slot that has reached this
             * level of commitment.
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
    ): SolanaRpcResponse<IsBlockhashValidApiResponse>;
};
