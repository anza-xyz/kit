import type { Commitment, Lamports } from '@solana/rpc-types';

type GetMinimumBalanceForRentExemptionApiResponse = Lamports;

export type GetMinimumBalanceForRentExemptionApi = {
    /**
     * Returns the minimum balance required to exempt an account from rent collection.
     *
     * @returns The minimum {@link Lamports | Lamport} balance required to grant an account of the
     * specified size an exemption from rent collection.
     * @see https://solana.com/docs/rpc/http/getminimumbalanceforrentexemption
     */
    getMinimumBalanceForRentExemption(
        /**
         * The number of bytes of account data for which an exemption from rent collection is being
         * sought.
         */
        size: bigint,
        config?: Readonly<{
            /**
             * Return the minimum balance as of the highest slot that has reached this level of
             * commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
        }>,
    ): GetMinimumBalanceForRentExemptionApiResponse;
};
