import type { Address } from '@solana/addresses';
import type {
    AccountInfoBase,
    AccountInfoWithBase58Bytes,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithJsonData,
    AccountInfoWithPubkey,
    Commitment,
    DataSlice,
    GetProgramAccountsDatasizeFilter,
    GetProgramAccountsMemcmpFilter,
    Slot,
    SolanaRpcResponse,
} from '@solana/rpc-types';

type GetProgramAccountsApiCommonConfig = Readonly<{
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
     *   to the owning program. If successful, the parsed data will be returned in the response as
     *   JSON. Otherwise, the raw account data will be returned in the response as a tuple whose
     *   first element is a base64-encoded string.
     */
    encoding?: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed';
    /**
     * Limits results to those that match all of these filters.
     *
     * This is useful when your aim is to find program accounts whose purpose is uniquely determined
     * by having a data buffer of a known size, or whose data contains a known series of bytes (eg.
     * a discriminator).
     *
     * You can specify up to 4 filters.
     *
     * @defaultValue When omitted, no filters are applied.
     */
    filters?: (GetProgramAccountsDatasizeFilter | GetProgramAccountsMemcmpFilter)[];
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
    /**
     * Wraps the result in an {@link RpcResponse} when `true`
     *
     * @defaultValue false
     */
    withContext?: boolean;
}>;

type GetProgramAccountsApiSliceableCommonConfig = Readonly<{
    /**
     * Define which slice of the accounts' data you want the RPC to return.
     *
     * Use this to save network bandwidth and encoding time when you do not need the entire buffer.
     *
     * Data slicing is only available for `"base58"`, `"base64"`, and `"base64+zstd"` encodings.
     */
    dataSlice?: DataSlice;
}>;

export type GetProgramAccountsApi = {
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, it will be returned in the response as a tuple whose first element
     * is a base64-encoded string.
     *
     * {@label base64-withcontext}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>[]>;
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, it will be returned in the response as a tuple whose first element
     * is a base64-encoded string.
     *
     * {@label base64}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>[];
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, it will first be compressed using
     * [ZStandard](https://facebook.github.io/zstd/) and the result will be returned in the response
     * as a tuple whose first element is a base64-encoded string.
     *
     * {@label base64-zstd-compressed-withcontext}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedZStdCompressedData>[]>;
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, it will first be compressed using
     * [ZStandard](https://facebook.github.io/zstd/) and the result will be returned in the response
     * as a tuple whose first element is a base64-encoded string.
     *
     * {@label base64-zstd-compressed}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedZStdCompressedData>[];
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, the server will attempt to process it using a parser specific to
     * the owning program. If successful, the parsed data will be returned in the response as JSON.
     * Otherwise, the raw account data will be returned in the response as a tuple whose first
     * element is a base64-encoded string.
     *
     * {@label parsed-withcontext}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithJsonData>[]>;
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, the server will attempt to process it using a parser specific to
     * the owning program. If successful, the parsed data will be returned in the response as JSON.
     * Otherwise, the raw account data will be returned in the response as a tuple whose first
     * element is a base64-encoded string.
     *
     * {@label parsed}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithJsonData>[];
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, it will be returned in the response as a tuple whose first element
     * is a base58-encoded string. If any account contains more than 129 bytes of data, this method
     * will raise an error.
     *
     * {@label base58-withcontext}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58EncodedData>[]>;
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, it will be returned in the response as a tuple whose first element
     * is a base58-encoded string. If any account contains more than 129 bytes of data, this method
     * will raise an error.
     *
     * {@label base58}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58EncodedData>[];
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, it will be returned in the response as a base58-encoded string. If
     * any account contains more than 129 bytes of data, this method will raise an error.
     *
     * {@label base58-legacy-withcontext}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58Bytes>[]>;
    /**
     * Fetches information associated with all accounts owned by the program at the given address.
     *
     * If the accounts have data, it will be returned in the response as a base58-encoded string. If
     * any account contains more than 129 bytes of data, this method will raise an error.
     *
     * {@label base58-legacy-withcontext}
     * @see https://solana.com/docs/rpc/http/getprogramaccounts
     */
    getProgramAccounts(
        program: Address,
        config?: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58Bytes>[];
};
