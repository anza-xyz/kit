import type { Address } from '@solana/addresses';
import type {
    AccountInfoBase,
    AccountInfoWithBase58Bytes,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithJsonData,
    Commitment,
    DataSlice,
    Slot,
    SolanaRpcResponse,
} from '@solana/rpc-types';

type GetAccountInfoApiResponse<T> = (AccountInfoBase & T) | null;

type GetAccountInfoApiCommonConfig = Readonly<{
    /**
     * Fetch the details of the account as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    encoding: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed';
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
}>;

type GetAccountInfoApiSliceableCommonConfig = Readonly<{
    /**
     * Define which slice of the account's data you want the RPC to return.
     *
     * Use this to save network bandwidth and encoding time when you do not need the entire buffer.
     */
    dataSlice?: DataSlice;
}>;

export type GetAccountInfoApi = {
    /**
     * Returns all information associated with the account of provided public key
     */
    getAccountInfo(
        address: Address,
        config: GetAccountInfoApiCommonConfig &
            GetAccountInfoApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>,
    ): SolanaRpcResponse<GetAccountInfoApiResponse<AccountInfoWithBase64EncodedData>>;
    getAccountInfo(
        address: Address,
        config: GetAccountInfoApiCommonConfig &
            GetAccountInfoApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>,
    ): SolanaRpcResponse<GetAccountInfoApiResponse<AccountInfoWithBase64EncodedZStdCompressedData>>;
    getAccountInfo(
        address: Address,
        config: GetAccountInfoApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): SolanaRpcResponse<GetAccountInfoApiResponse<AccountInfoWithJsonData>>;
    getAccountInfo(
        address: Address,
        config: GetAccountInfoApiCommonConfig &
            GetAccountInfoApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>,
    ): SolanaRpcResponse<GetAccountInfoApiResponse<AccountInfoWithBase58EncodedData>>;
    getAccountInfo(
        address: Address,
        config?: Omit<GetAccountInfoApiCommonConfig, 'encoding'>,
    ): SolanaRpcResponse<GetAccountInfoApiResponse<AccountInfoWithBase58Bytes>>;
};
