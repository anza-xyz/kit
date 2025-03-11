import type { Address } from '@solana/addresses';
import type { Commitment, Lamports, Slot, SolanaRpcResponse } from '@solana/rpc-types';

type GetBalanceApiResponse = SolanaRpcResponse<Lamports>;

export type GetBalanceApi = {
    /**
     * Returns the balance of the account of provided Pubkey
     */
    getBalance(
        address: Address,
        config?: Readonly<{
            /**
             * Fetch the balance of the account as of the highest slot that has reached this level
             * of commitment.
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
    ): GetBalanceApiResponse;
};
