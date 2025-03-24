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
    excludeNonCirculatingAccountsList?: boolean;
}>;

type GetSupplyApiResponseBase = Readonly<{
    /** Circulating supply in {@link Lamports} */
    circulating: Lamports;
    /** Non-circulating supply in {@link Lamports} */
    nonCirculating: Lamports;
    /** Total supply in {@link Lamports} */
    total: Lamports;
}>;

type GetSupplyApiResponseWithNonCirculatingAccounts = GetSupplyApiResponseBase &
    Readonly<{
        /** Addresses of non-circulating accounts */
        nonCirculatingAccounts: Address[];
    }>;

type GetSupplyApiResponseWithoutNonCirculatingAccounts = GetSupplyApiResponseBase &
    Readonly<{
        /**
         * An empty array, since the `excludeNonCirculatingAccountsList` argument was not set to
         * `true`.
         */
        nonCirculatingAccounts: never[];
    }>;

export type GetSupplyApi = {
    /**
     * Returns information about the current supply, excluding the list of non-circulating accounts.
     *
     * {@label exclude-non-circulating-accounts}
     * @see https://solana.com/docs/rpc/http/getsupply
     */
    getSupply(
        config: GetSupplyConfig &
            Readonly<{
                excludeNonCirculatingAccountsList: true;
            }>,
    ): SolanaRpcResponse<GetSupplyApiResponseWithoutNonCirculatingAccounts>;
    /**
     * Returns information about the current supply.
     *
     * {@label default}
     * @see https://solana.com/docs/rpc/http/getsupply
     */
    getSupply(
        config?: GetSupplyConfig &
            Readonly<{
                excludeNonCirculatingAccountsList?: false;
            }>,
    ): SolanaRpcResponse<GetSupplyApiResponseWithNonCirculatingAccounts>;
};
