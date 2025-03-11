import type { Commitment, Lamports, SolanaRpcResponse } from '@solana/rpc-types';

type GetStakeMinimumDelegationApiResponse = Lamports;

export type GetStakeMinimumDelegationApi = {
    /**
     * Returns the stake minimum delegation, in lamports.
     */
    getStakeMinimumDelegation(
        config?: Readonly<{
            /**
             * Fetch the minimum delegation as of  highest slot that has reached this level of
             * commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
        }>,
    ): SolanaRpcResponse<GetStakeMinimumDelegationApiResponse>;
};
