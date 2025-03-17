import type { Commitment, Lamports, Slot, SolanaRpcResponse } from '@solana/rpc-types';
import type { TransactionMessageBytesBase64 } from '@solana/transactions';

type GetFeeForMessageApiResponse = Lamports | null;

export type GetFeeForMessageApi = {
    /**
     * Returns the fee the network will charge for a particular message
     *
     * @returns The fee that the network will charge to process the message, in {@link Lamports}, as
     * computed at the specified blockhash.
     * @see https://solana.com/docs/rpc/http/getfeeformessage
     */
    getFeeForMessage(
        /** A transaction message encoded as a base64 string */
        message: TransactionMessageBytesBase64,
        config?: Readonly<{
            /**
             * Fetch the fee information as of the highest slot that has reached this level of
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
    ): SolanaRpcResponse<GetFeeForMessageApiResponse>;
};
