import type { Address } from '@solana/addresses';
import type { Commitment, SolanaRpcResponse, TokenAmount } from '@solana/rpc-types';

type GetTokenAccountBalanceApiResponse = TokenAmount;

export type GetTokenAccountBalanceApi = {
    /**
     * Returns the balance of an SPL Token account.
     *
     * @see https://solana.com/docs/rpc/http/gettokenaccountbalance
     */
    getTokenAccountBalance(
        address: Address,
        config?: Readonly<{
            /**
             * Fetch the balance as of the highest slot that has reached this level of commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
        }>,
    ): SolanaRpcResponse<GetTokenAccountBalanceApiResponse>;
};
