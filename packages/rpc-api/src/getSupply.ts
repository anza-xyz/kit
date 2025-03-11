import type { Address } from '@solana/addresses';
import type { Commitment, Lamports, SolanaRpcResponse } from '@solana/rpc-types';

type GetSupplyConfig = Readonly<{
    /**
     * Fetch the supply as of the highest slot that has reached this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
}>;

type GetSupplyApiResponseBase = Readonly<{
    /** Circulating supply in lamports */
    circulating: Lamports;
    /** Non-circulating supply in lamports */
    nonCirculating: Lamports;
    /** Total supply in lamports */
    total: Lamports;
}>;

type GetSupplyApiResponseWithNonCirculatingAccounts = GetSupplyApiResponseBase &
    Readonly<{
        /** an array of account addresses of non-circulating accounts */
        nonCirculatingAccounts: Address[];
    }>;

type GetSupplyApiResponseWithoutNonCirculatingAccounts = GetSupplyApiResponseBase &
    Readonly<{
        /** As per the docs:
         * "If `excludeNonCirculatingAccountsList` is enabled, the returned array will be empty."
         * See: https://solana.com/docs/rpc/http/getsupply
         */
        nonCirculatingAccounts: never[];
    }>;

export type GetSupplyApi = {
    /**
     * Returns information about the current supply.
     */
    getSupply(
        config: GetSupplyConfig &
            Readonly<{
                excludeNonCirculatingAccountsList: true;
            }>,
    ): SolanaRpcResponse<GetSupplyApiResponseWithoutNonCirculatingAccounts>;
    getSupply(
        config?: GetSupplyConfig &
            Readonly<{
                excludeNonCirculatingAccountsList?: false;
            }>,
    ): SolanaRpcResponse<GetSupplyApiResponseWithNonCirculatingAccounts>;
};
