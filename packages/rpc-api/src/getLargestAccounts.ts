import type { Address } from '@solana/addresses';
import type { Commitment, Lamports, SolanaRpcResponse } from '@solana/rpc-types';

type GetLargestAccountsResponseItem = Readonly<{
    /** Base-58 encoded address of the account */
    address: Address;
    /** Number of {@link Lamports} in the account */
    lamports: Lamports;
}>;

type GetLargestAccountsApiResponse = readonly GetLargestAccountsResponseItem[];

export type GetLargestAccountsApi = {
    /**
     * Returns the 20 largest accounts, by {@link Lamports | Lamport} balance.
     *
     * Results may be cached up to two hours.
     *
     * @see https://solana.com/docs/rpc/http/getlargestaccounts
     */
    getLargestAccounts(
        config?: Readonly<{
            /**
             * Fetch the largest accounts as of the highest slot that has reached this level of
             * commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
            /**
             * Filter results by account type.
             *
             * @defaultValue When not specified, all accounts will be considered regardless of their
             * type.
             */
            filter?: 'circulating' | 'nonCirculating';
        }>,
    ): SolanaRpcResponse<GetLargestAccountsApiResponse>;
};
