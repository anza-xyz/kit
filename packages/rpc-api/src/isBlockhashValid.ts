import type { Blockhash, Commitment, Slot, SolanaRpcResponse } from '@solana/rpc-types';

type IsBlockhashValidApiResponse = boolean;

export type IsBlockhashValidApi = {
    /**
     * Returns whether a blockhash is still valid or not
     */
    isBlockhashValid(
        /** query blockhash, as a base-58 encoded string */
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
            /** The minimum slot that the request can be evaluated at */
            minContextSlot?: Slot;
        }>,
    ): SolanaRpcResponse<IsBlockhashValidApiResponse>;
};
