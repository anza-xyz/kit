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
    GetProgramAccountsDatasizeFilter,
    GetProgramAccountsMemcmpFilter,
    SolanaRpcResponse,
} from '@solana/rpc-types';

type ProgramNotificationsApiNotificationBase<TData> = SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & TData>>;

type ProgramNotificationsApiCommonConfig = Readonly<{
    /**
     * Get notified when a modification to an account has reached this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcSubscriptionsApi} in
     * use. For example, when using an API created by a `createSolanaRpcSubscriptions*()` helper,
     * the default commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API
     * layer on the client, the default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
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
    filters?: readonly Readonly<GetProgramAccountsDatasizeFilter | GetProgramAccountsMemcmpFilter>[];
}>;

export type ProgramNotificationsApi = {
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of any
     * account owned by the program at the given address changes.
     *
     * The notification format is the same as seen in the
     * {@link GetProgramAccountsApi.getProgramAccounts} RPC HTTP method.
     *
     * If the account has data, it will be returned in the response as a tuple whose first element
     * is a base64-encoded string.
     *
     * {@label base64}
     * @see https://solana.com/docs/rpc/websocket/programsubscribe
     */
    programNotifications(
        programId: Address,
        config: ProgramNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithBase64EncodedData>;
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of any
     * account owned by the program at the given address changes.
     *
     * The notification format is the same as seen in the
     * {@link GetProgramAccountsApi.getProgramAccounts} RPC HTTP method.
     *
     * If the account has data, it will first be compressed using
     * [ZStandard](https://facebook.github.io/zstd/) and the result will be returned in the response
     * as a tuple whose first element is a base64-encoded string.
     *
     * {@label base64-zstd-compressed}
     * @see https://solana.com/docs/rpc/websocket/programsubscribe
     */
    programNotifications(
        programId: Address,
        config: ProgramNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithBase64EncodedZStdCompressedData>;
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of any
     * account owned by the program at the given address changes.
     *
     * The notification format is the same as seen in the
     * {@link GetProgramAccountsApi.getProgramAccounts} RPC HTTP method.
     *
     * If the account has data, the server will attempt to process it using a parser specific to the
     * account's owning program. If successful, the parsed data will be returned in the response as
     * JSON. Otherwise, the raw account data will be returned in the response as a tuple whose first
     * element is a base64-encoded string.
     *
     * {@label parsed}
     * @see https://solana.com/docs/rpc/websocket/programsubscribe
     */
    programNotifications(
        programId: Address,
        config: ProgramNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithJsonData>;
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of any
     * account owned by the program at the given address changes.
     *
     * The notification format is the same as seen in the
     * {@link GetProgramAccountsApi.getProgramAccounts} RPC HTTP method.
     *
     * If the account has data, it will be returned in the response as a tuple whose first element
     * is a base58-encoded string. If the account contains more than 129 bytes of data, the `data`
     * field will materialize as the string `"error: data too large for bs58 encoding"`.
     *
     * {@label base58}
     * @see https://solana.com/docs/rpc/websocket/programsubscribe
     */
    programNotifications(
        programId: Address,
        config: ProgramNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithBase58EncodedData>;
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of any
     * account owned by the program at the given address changes.
     *
     * The notification format is the same as seen in the
     * {@link GetProgramAccountsApi.getProgramAccounts} RPC HTTP method.
     *
     * If the account has data, it will be returned in the response as a base58-encoded string. If
     * the account contains more than 129 bytes of data, the `data` field will materialize as the
     * string `"error: data too large for bs58 encoding"`.
     *
     * {@label base58-legacy}
     * @see https://solana.com/docs/rpc/websocket/programsubscribe
     */
    programNotifications(
        programId: Address,
        config?: ProgramNotificationsApiCommonConfig,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithBase58Bytes>;
};
