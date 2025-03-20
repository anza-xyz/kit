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
     * Determines how the accounts' data should be encoded in the response.
     *
     * - `'base58'` returns a tuple whose first element is the data as a base58-encoded string. If
     *   the account contains more than 129 bytes of data, an error will be raised.
     * - `'base64'` returns a tuple whose first element is the data as a base64-encoded string.
     * - `'base64+zstd'` returns a tuple whose first element is the
     *   [ZStandard](https://facebook.github.io/zstd/)-compressed data as a base64-encoded string.
     * - `'jsonParsed'` will cause the server to attempt to process the data using a parser specific
     *   to each account's owning program. If successful, the parsed data will be returned in the
     *   response as JSON. Otherwise, the raw account data will be returned in the response as a
     *   tuple whose first element is a base64-encoded string.
     */
    encoding?: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed';
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
}>;

type GetMultipleAccountsApiSliceableCommonConfig = Readonly<{
    /**
     * Define which slice of the accounts' data you want the RPC to return.
     *
     * Use this to save network bandwidth and encoding time when you do not need the entire buffer.
     *
     * Data slicing is only available for `"base58"`, `"base64"`, and `"base64+zstd"` encodings.
     */
    dataSlice?: DataSlice;
}>;

export type GetMultipleAccountsApi = {
    /**
     * Fetches information associated with the accounts at the given addresses.
     *
     * If the accounts have data, it will be returned in the response as a tuple whose first element
     * is a base64-encoded string.
     *
     * @param addresses A maximum of 100 addresses for which to fetch account data
     *
     * {@label base64}
     * @see https://solana.com/docs/rpc/http/getmultipleaccounts
     */
    getMultipleAccounts(
        addresses: Address[],
        config: GetMultipleAccountsApiCommonConfig &
            GetMultipleAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>,
    ): SolanaRpcResponse<(GetMultipleAccountsApiResponseBase & (AccountInfoWithBase64EncodedData | null))[]>;
    /**
     * Fetches information associated with the accounts at the given addresses.
     *
     * If the accounts have data, it will first be compressed using
     * [ZStandard](https://facebook.github.io/zstd/) and the result will be returned in the response
     * as a tuple whose first element is a base64-encoded string.
     *
     * @param addresses A maximum of 100 addresses for which to fetch account data
     *
     * {@label base64-zstd-compressed}
     * @see https://solana.com/docs/rpc/http/getmultipleaccounts
     */
    getMultipleAccounts(
        addresses: Address[],
        config: GetMultipleAccountsApiCommonConfig &
            GetMultipleAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>,
    ): SolanaRpcResponse<
        (GetMultipleAccountsApiResponseBase & (AccountInfoWithBase64EncodedZStdCompressedData | null))[]
    >;
    /**
     * Fetches information associated with the accounts at the given addresses.
     *
     * If the accounts have data, the server will attempt to process it using a parser specific to
     * each account's owning program. If successful, the parsed data will be returned in the
     * response as JSON. Otherwise, the raw account data will be returned in the response as a tuple
     * whose first element is a base64-encoded string.
     *
     * @param addresses A maximum of 100 addresses for which to fetch account data
     *
     * {@label parsed}
     * @see https://solana.com/docs/rpc/http/getmultipleaccounts
     */
    getMultipleAccounts(
        addresses: Address[],
        config: GetMultipleAccountsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): SolanaRpcResponse<(GetMultipleAccountsApiResponseBase & (AccountInfoWithJsonData | null))[]>;
    /**
     * Fetches information associated with the accounts at the given addresses.
     *
     * If the accounts have data, it will be returned in the response as a tuple whose first element
     * is a base58-encoded string. If any account contains more than 129 bytes of data, this method
     * will raise an error.
     *
     * @param addresses A maximum of 100 addresses for which to fetch account data
     *
     * {@label base58}
     * @see https://solana.com/docs/rpc/http/getmultipleaccounts
     */
    getMultipleAccounts(
        addresses: Address[],
        config: GetMultipleAccountsApiCommonConfig &
            GetMultipleAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>,
    ): SolanaRpcResponse<(GetMultipleAccountsApiResponseBase & (AccountInfoWithBase58EncodedData | null))[]>;
    /**
     * Fetches information associated with the accounts at the given addresses.
     *
     * If the accounts have data, it will be returned in the response as a base58-encoded string. If
     * any account contains more than 129 bytes of data, this method will raise an error.
     *
     * @param addresses A maximum of 100 addresses for which to fetch account data
     *
     * {@label base58-legacy}
     * @see https://solana.com/docs/rpc/http/getmultipleaccounts
     */
    getMultipleAccounts(
        addresses: Address[],
        config?: GetMultipleAccountsApiCommonConfig,
    ): SolanaRpcResponse<(GetMultipleAccountsApiResponseBase & (AccountInfoWithBase64EncodedData | null))[]>;
};
