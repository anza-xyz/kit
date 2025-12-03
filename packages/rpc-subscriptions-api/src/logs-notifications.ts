import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { Commitment, SolanaRpcResponse, TransactionError } from '@solana/rpc-types';

type LogsNotificationsApiNotification = SolanaRpcResponse<
    Readonly<{
        /** Error if transaction failed, null if transaction succeeded. */
        err: TransactionError | null;
        /** Array of log messages the transaction instructions output during execution. */
        logs: readonly string[];
        /** Transaction signature as base-58 encoded string */
        signature: Signature;
    }>
>;

type LogsNotificationsApiConfig = Readonly<{
    /**
     * Get notified on logs from new transactions that have reached this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcSubscriptionsApi} in
     * use. For example, when using an API created by a `createSolanaRpcSubscriptions*()` helper,
     * the default commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API
     * layer on the client, the default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
}>;

export type LogsNotificationsApi = {
    /**
     * Subscribe to receive notifications containing the logs of all non-vote transactions.
     *
     * {@label non-vote}
     * @see https://solana.com/docs/rpc/websocket/logssubscribe
     */
    logsNotifications(filter: 'all', config?: LogsNotificationsApiConfig): LogsNotificationsApiNotification;
    /**
     * Subscribe to receive notifications containing the logs of all transactions.
     *
     * {@label all}
     * @see https://solana.com/docs/rpc/websocket/logssubscribe
     */
    logsNotifications(filter: 'allWithVotes', config?: LogsNotificationsApiConfig): LogsNotificationsApiNotification;
    /**
     * Subscribe to receive notifications containing the logs of transactions that mention the
     * supplied program or account.

    * {@label all-that-mention}
     * @see https://solana.com/docs/rpc/websocket/logssubscribe
     */
    logsNotifications(
        filter: {
            /**
             * This filter matches when a transaction mentions the single address provided.
             *
             * This filter currently only supports one address per method call. Listing additional
             * addresses will result in an error.
             */
            mentions: [Address];
        },
        config?: LogsNotificationsApiConfig,
    ): LogsNotificationsApiNotification;
};
