import type { Address } from '@solana/addresses';
import type {
    AccountInfoBase,
    AccountInfoWithBase58Bytes,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithJsonData,
    Commitment,
    SolanaRpcResponse,
} from '@solana/rpc-types';

type AccountNotificationsApiCommonConfig = Readonly<{
    /**
     * Get notified when a modification to an account has reached this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcSubscriptionsApi} in
     * use. For example, when using an API created by a `createSolanaRpcSubscriptions*()` helper,
     * the default commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API
     * layer on the client, the default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
}>;

export type AccountNotificationsApi = {
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of the
     * account at the specified address.
     *
     * The notification format is the same as seen in the {@link GetAccountInfoApi.getAccountInfo}
     * RPC HTTP method.
     *
     * If the account has data, it will be returned in the response as a tuple whose first element
     * is a base64-encoded string.
     *
     * {@label base64}
     * @see https://solana.com/docs/rpc/websocket/accountsubscribe
     */
    accountNotifications(
        address: Address,
        config: AccountNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>,
    ): SolanaRpcResponse<AccountInfoBase & AccountInfoWithBase64EncodedData>;
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of the
     * account at the specified address.
     *
     * The notification format is the same as seen in the {@link GetAccountInfoApi.getAccountInfo}
     * RPC HTTP method.
     *
     * If the account has data, it will first be compressed using
     * [ZStandard](https://facebook.github.io/zstd/) and the result will be returned in the response
     * as a tuple whose first element is a base64-encoded string.
     *
     * {@label base64-zstd-compressed}
     * @see https://solana.com/docs/rpc/websocket/accountsubscribe
     */
    accountNotifications(
        address: Address,
        config: AccountNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>,
    ): SolanaRpcResponse<AccountInfoBase & AccountInfoWithBase64EncodedZStdCompressedData>;
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of the
     * account at the specified address.
     *
     * The notification format is the same as seen in the {@link GetAccountInfoApi.getAccountInfo}
     * RPC HTTP method.
     *
     * If the account has data, the server will attempt to process it using a parser specific to the
     * account's owning program. If successful, the parsed data will be returned in the response as
     * JSON. Otherwise, the raw account data will be returned in the response as a tuple whose first
     * element is a base64-encoded string.
     *
     * {@label parsed}
     * @see https://solana.com/docs/rpc/websocket/accountsubscribe
     */
    accountNotifications(
        address: Address,
        config: AccountNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): SolanaRpcResponse<AccountInfoBase & AccountInfoWithJsonData>;
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of the
     * account at the specified address.
     *
     * The notification format is the same as seen in the {@link GetAccountInfoApi.getAccountInfo}
     * RPC HTTP method.
     *
     * If the account has data, it will be returned in the response as a tuple whose first element
     * is a base58-encoded string. If the account contains more than 129 bytes of data, the `data`
     * field will materialize as the string `"error: data too large for bs58 encoding"`.
     *
     * {@label base58}
     * @see https://solana.com/docs/rpc/websocket/accountsubscribe
     */
    accountNotifications(
        address: Address,
        config: AccountNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>,
    ): SolanaRpcResponse<AccountInfoBase & AccountInfoWithBase58EncodedData>;
    /**
     * Subscribe for notifications when there is a change in the {@link Lamports} or data of the
     * account at the specified address.
     *
     * The notification format is the same as seen in the {@link GetAccountInfoApi.getAccountInfo}
     * RPC HTTP method.
     *
     * If the account has data, it will be returned in the response as a base58-encoded string. If
     * the account contains more than 129 bytes of data, the `data` field will materialize as the
     * string `"error: data too large for bs58 encoding"`.
     *
     * {@label base58-legacy}
     * @see https://solana.com/docs/rpc/websocket/accountsubscribe
     */
    accountNotifications(
        address: Address,
        config?: AccountNotificationsApiCommonConfig,
    ): SolanaRpcResponse<AccountInfoBase & AccountInfoWithBase58Bytes>;
};
