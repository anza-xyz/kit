import type { Address } from '@solana/addresses';
import type { JsonParsedTokenAccount } from '@solana/rpc-parsed-types';
import type {
    AccountInfoBase,
    AccountInfoWithBase58Bytes,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithPubkey,
    Commitment,
    DataSlice,
    Slot,
    SolanaRpcResponse,
} from '@solana/rpc-types';

type TokenAccountInfoWithJsonData = Readonly<{
    data: Readonly<{
        parsed: {
            info: JsonParsedTokenAccount;
            type: 'account';
        };
        /** Name of the program that owns this account. */
        program: Address;
        space: bigint;
    }>;
}>;

type GetTokenAccountsByOwnerResponse<T> = readonly AccountInfoWithPubkey<AccountInfoBase & T>[];

type MintFilter = Readonly<{
    /** Pubkey of the specific token Mint to limit accounts to */
    mint: Address;
}>;

type ProgramIdFilter = Readonly<{
    /** Pubkey of the Token program that owns the accounts */
    programId: Address;
}>;

type AccountsFilter = MintFilter | ProgramIdFilter;

type GetTokenAccountsByOwnerApiCommonConfig = Readonly<{
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

type GetTokenAccountsByOwnerApiSliceableCommonConfig = Readonly<{
    /**
     * Define which slice of the accounts' data you want the RPC to return.
     *
     * Use this to save network bandwidth and encoding time when you do not need the entire buffer.
     *
     * Data slicing is only available for `"base58"`, `"base64"`, and `"base64+zstd"` encodings.
     */
    dataSlice?: DataSlice;
}>;
export type GetTokenAccountsByOwnerApi = {
    /**
     * Returns all SPL Token accounts by token owner.
     */
    getTokenAccountsByOwner(
        owner: Address,
        filter: AccountsFilter,
        config: GetTokenAccountsByOwnerApiCommonConfig &
            GetTokenAccountsByOwnerApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>,
    ): SolanaRpcResponse<GetTokenAccountsByOwnerResponse<AccountInfoWithBase64EncodedData>>;

    getTokenAccountsByOwner(
        owner: Address,
        filter: AccountsFilter,
        config: GetTokenAccountsByOwnerApiCommonConfig &
            GetTokenAccountsByOwnerApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>,
    ): SolanaRpcResponse<GetTokenAccountsByOwnerResponse<AccountInfoWithBase64EncodedZStdCompressedData>>;

    getTokenAccountsByOwner(
        owner: Address,
        filter: AccountsFilter,
        config: GetTokenAccountsByOwnerApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): SolanaRpcResponse<GetTokenAccountsByOwnerResponse<TokenAccountInfoWithJsonData>>;

    getTokenAccountsByOwner(
        owner: Address,
        filter: AccountsFilter,
        config: GetTokenAccountsByOwnerApiCommonConfig &
            GetTokenAccountsByOwnerApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>,
    ): SolanaRpcResponse<GetTokenAccountsByOwnerResponse<AccountInfoWithBase58EncodedData>>;

    getTokenAccountsByOwner(
        owner: Address,
        filter: AccountsFilter,
        config?: GetTokenAccountsByOwnerApiCommonConfig & GetTokenAccountsByOwnerApiSliceableCommonConfig,
    ): SolanaRpcResponse<GetTokenAccountsByOwnerResponse<AccountInfoWithBase58Bytes>>;
};
