import type { Address } from '@solana/addresses';
import type { Commitment, SolanaRpcResponse, TokenAmount } from '@solana/rpc-types';

type GetTokenSupplyApiResponse = TokenAmount;

export type GetTokenSupplyApi = {
    /**
     * Returns the total supply of the token mint supplied.
     *
     * @see https://solana.com/docs/rpc/http/gettokensupply
     */
    getTokenSupply(
        tokenMint: Address,
        config?: Readonly<{
            /**
             * Fetch the supply as of the highest slot that has reached this level of commitment.
             *
             * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use.
             * For example, when using an API created by a `createSolanaRpc*()` helper, the default
             * commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API layer
             * on the client, the default commitment applied by the server is `"finalized"`.
             */
            commitment?: Commitment;
        }>,
    ): SolanaRpcResponse<GetTokenSupplyApiResponse>;
};
