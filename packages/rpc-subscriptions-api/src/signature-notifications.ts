import type { Signature } from '@solana/keys';
import type { Commitment, SolanaRpcResponse, TransactionError } from '@solana/rpc-types';

type SignatureNotificationsApiNotificationReceived = SolanaRpcResponse<Readonly<'receivedSignature'>>;

type SignatureNotificationsApiNotificationProcessed = SolanaRpcResponse<
    Readonly<{
        /** Error if transaction failed, null if transaction succeeded. */
        err: TransactionError | null;
    }>
>;

type SignatureNotificationsApiConfigBase = Readonly<{
    /**
     * Get notified when the transaction with the specified signature has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcSubscriptionsApi} in
     * use. For example, when using an API created by a `createSolanaRpcSubscriptions*()` helper,
     * the default commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API
     * layer on the client, the default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    /**
     * Whether or not to subscribe for notifications when signatures are received by the RPC, in
     * addition to when they are processed.
     *
     * @defaultValue false
     */
    enableReceivedNotification?: boolean;
}>;

export type SignatureNotificationsApi = {
    /**
     * Subscribe to a receive a notification when the transaction identified by the given signature
     * is received by the cluster, then again when it reaches the specified level of commitment.
     *
     * This subscription will not issue notifications for events that have already happened. To
     * fetch the commitment status of any transaction at a point in time use the
     * {@link GetSignatureStatusesApi.getSignatureStatuses | getSignatureStatuses} method of the RPC
     * API.
     *
     * @param signature Transaction signature as base-58 encoded string
     *
     * @see https://solana.com/docs/rpc/websocket/signaturesubscribe
     */
    signatureNotifications(
        signature: Signature,
        config: Readonly<{
            enableReceivedNotification: true;
        }> &
            SignatureNotificationsApiConfigBase,
    ): SignatureNotificationsApiNotificationProcessed | SignatureNotificationsApiNotificationReceived;
    /**
     * Subscribe to a receive a notification when the transaction identified by the given signature
     * reaches the specified level of commitment.
     *
     * This subscription will not issue notifications for events that have already happened. To
     * fetch the commitment status of any transaction at a point in time use the
     * {@link GetSignatureStatusesApi.getSignatureStatuses | getSignatureStatuses} method of the RPC
     * API.
     *
     * @param signature Transaction signature as base-58 encoded string
     *
     * @see https://solana.com/docs/rpc/websocket/signaturesubscribe
     */
    signatureNotifications(
        signature: Signature,
        config?: Readonly<{
            enableReceivedNotification?: false;
        }> &
            SignatureNotificationsApiConfigBase,
    ): SignatureNotificationsApiNotificationProcessed;
};
