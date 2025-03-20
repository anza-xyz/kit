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
    /** filter results (up to 4 filters allowed) @see https://docs.solana.com/api/http#filter-criteria */
    filters?: (GetProgramAccountsDatasizeFilter | GetProgramAccountsMemcmpFilter)[];
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
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
     * Returns the account information for a list of Pubkeys.
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

    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>[];

    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedZStdCompressedData>[]>;

    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedZStdCompressedData>[];

    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithJsonData>[]>;

    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithJsonData>[];

    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58EncodedData>[]>;

    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58EncodedData>[];

    getProgramAccounts(
        program: Address,
        config: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                withContext: true;
            }>,
    ): SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58Bytes>[]>;

    getProgramAccounts(
        program: Address,
        config?: GetProgramAccountsApiCommonConfig &
            GetProgramAccountsApiSliceableCommonConfig &
            Readonly<{
                withContext?: boolean;
            }>,
    ): AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58Bytes>[];
};
