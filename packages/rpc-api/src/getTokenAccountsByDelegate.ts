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

type GetTokenAccountsByDelegateResponse<T> = readonly AccountInfoWithPubkey<AccountInfoBase & T>[];

type MintFilter = Readonly<{
    /** This filter matches when the token account's mint is equal to the address supplied. */
    mint: Address;
}>;

type ProgramIdFilter = Readonly<{
    /**
     * This filter matches when the token account's token program address is equal to the address
     * supplied.
     */
    programId: Address;
}>;

type AccountsFilter = MintFilter | ProgramIdFilter;

type GetTokenAccountsByDelegateApiCommonConfig = Readonly<{
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

type GetTokenAccountsByDelegateApiSliceableCommonConfig = Readonly<{
    /**
     * Define which slice of the accounts' data you want the RPC to return.
     *
     * Use this to save network bandwidth and encoding time when you do not need the entire buffer.
     *
     * Data slicing is only available for `"base58"`, `"base64"`, and `"base64+zstd"` encodings.
     */
    dataSlice?: DataSlice;
}>;

export type GetTokenAccountsByDelegateApi = {
    /**
     * Returns all SPL Token accounts for which transfer authority over some quantity of tokens has
     * been delegated to the supplied address.
     *
     * The accounts' data will be returned in the response as a tuple whose first element is a
     * base64-encoded string.
     *
     * @param filter Limits the results to either token accounts associated with a particular mint,
     * or token accounts owned by a certain token program.
     *
     * {@label base64}
     * @see https://solana.com/docs/rpc/http/gettokenaccountsbydelegate
     */
    getTokenAccountsByDelegate(
        delegate: Address,
        filter: AccountsFilter,
        config: GetTokenAccountsByDelegateApiCommonConfig &
            GetTokenAccountsByDelegateApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>,
    ): SolanaRpcResponse<GetTokenAccountsByDelegateResponse<AccountInfoWithBase64EncodedData>>;
    /**
     * Returns all SPL Token accounts for which transfer authority over some quantity of tokens has
     * been delegated to the supplied address.
     *
     * The accounts' data will first be compressed using
     * [ZStandard](https://facebook.github.io/zstd/) and the result will be returned in the response
     * as a tuple whose first element is a base64-encoded string.
     *
     * @param filter Limits the results to either token accounts associated with a particular mint,
     * or token accounts owned by a certain token program.
     *
     * {@label base64-zstd-compressed}
     * @see https://solana.com/docs/rpc/http/gettokenaccountsbydelegate
     */
    getTokenAccountsByDelegate(
        delegate: Address,
        filter: AccountsFilter,
        config: GetTokenAccountsByDelegateApiCommonConfig &
            GetTokenAccountsByDelegateApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>,
    ): SolanaRpcResponse<GetTokenAccountsByDelegateResponse<AccountInfoWithBase64EncodedZStdCompressedData>>;
    /**
     * Returns all SPL Token accounts for which transfer authority over some quantity of tokens has
     * been delegated to the supplied address.
     *
     * The server will attempt to process the accounts' data using a parser specific to each
     * account's owning token program.
     *
     * @param filter Limits the results to either token accounts associated with a particular mint,
     * or token accounts owned by a certain token program.
     *
     * {@label parsed}
     * @see https://solana.com/docs/rpc/http/gettokenaccountsbydelegate
     */
    getTokenAccountsByDelegate(
        delegate: Address,
        filter: AccountsFilter,
        config: GetTokenAccountsByDelegateApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): SolanaRpcResponse<GetTokenAccountsByDelegateResponse<TokenAccountInfoWithJsonData>>;
    /**
     * Returns all SPL Token accounts for which transfer authority over some quantity of tokens has
     * been delegated to the supplied address.
     *
     * The accounts' data will be returned in the response as a tuple whose first element is a
     * base58-encoded string. If any account contains more than 129 bytes of data, this method will
     * raise an error.
     *
     * @param filter Limits the results to either token accounts associated with a particular mint,
     * or token accounts owned by a certain token program.
     *
     * {@label base58}
     * @see https://solana.com/docs/rpc/http/gettokenaccountsbydelegate
     */
    getTokenAccountsByDelegate(
        delegate: Address,
        filter: AccountsFilter,
        config: GetTokenAccountsByDelegateApiCommonConfig &
            GetTokenAccountsByDelegateApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>,
    ): SolanaRpcResponse<GetTokenAccountsByDelegateResponse<AccountInfoWithBase58EncodedData>>;
    /**
     * Returns all SPL Token accounts for which transfer authority over some quantity of tokens has
     * been delegated to the supplied address.
     *
     * The accounts' data will be returned in the response as a base58-encoded string. If any
     * account contains more than 129 bytes of data, this method will raise an error.
     *
     * @param filter Limits the results to either token accounts associated with a particular mint,
     * or token accounts owned by a certain token program.
     *
     * {@label base58-legacy}
     * @see https://solana.com/docs/rpc/http/gettokenaccountsbydelegate
     */
    getTokenAccountsByDelegate(
        delegate: Address,
        filter: AccountsFilter,
        config?: GetTokenAccountsByDelegateApiCommonConfig & GetTokenAccountsByDelegateApiSliceableCommonConfig,
    ): SolanaRpcResponse<GetTokenAccountsByDelegateResponse<AccountInfoWithBase58Bytes>>;
};
