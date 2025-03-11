import type { Address } from '@solana/addresses';
import type {
    AccountInfoBase,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithJsonData,
    Commitment,
    DataSlice,
    Slot,
    SolanaRpcResponse,
} from '@solana/rpc-types';

type GetMultipleAccountsApiResponseBase = AccountInfoBase | null;

type GetMultipleAccountsApiCommonConfig = Readonly<{
    /**
     * Fetch the details of the accounts as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
}>;

type GetMultipleAccountsApiSliceableCommonConfig = Readonly<{
    /** Limit the returned account data */
    dataSlice?: DataSlice;
}>;

export type GetMultipleAccountsApi = {
    /**
     * Returns the account information for a list of Pubkeys.
     */
    getMultipleAccounts(
        /** An array of up to 100 Pubkeys to query */
        addresses: Address[],
        config: GetMultipleAccountsApiCommonConfig &
            GetMultipleAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>,
    ): SolanaRpcResponse<(GetMultipleAccountsApiResponseBase & (AccountInfoWithBase64EncodedData | null))[]>;
    getMultipleAccounts(
        /** An array of up to 100 Pubkeys to query */
        addresses: Address[],
        config: GetMultipleAccountsApiCommonConfig &
            GetMultipleAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>,
    ): SolanaRpcResponse<
        (GetMultipleAccountsApiResponseBase & (AccountInfoWithBase64EncodedZStdCompressedData | null))[]
    >;
    getMultipleAccounts(
        /** An array of up to 100 Pubkeys to query */
        addresses: Address[],
        config: GetMultipleAccountsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): SolanaRpcResponse<(GetMultipleAccountsApiResponseBase & (AccountInfoWithJsonData | null))[]>;
    getMultipleAccounts(
        /** An array of up to 100 Pubkeys to query */
        addresses: Address[],
        config: GetMultipleAccountsApiCommonConfig &
            GetMultipleAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>,
    ): SolanaRpcResponse<(GetMultipleAccountsApiResponseBase & (AccountInfoWithBase58EncodedData | null))[]>;
    getMultipleAccounts(
        /** An array of up to 100 Pubkeys to query */
        addresses: Address[],
        config?: GetMultipleAccountsApiCommonConfig,
    ): SolanaRpcResponse<(GetMultipleAccountsApiResponseBase & (AccountInfoWithBase64EncodedData | null))[]>;
};
