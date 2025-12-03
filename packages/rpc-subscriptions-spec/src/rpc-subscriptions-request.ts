/**
 * Pending subscriptions are the result of calling a supported method on a {@link RpcSubscriptions}
 * object. They encapsulate all of the information necessary to make the subscription without
 * actually making it.
 *
 * Calling the {@link PendingRpcSubscriptionsRequest.subscribe | `subscribe(options)`} method on a
 * {@link PendingRpcSubscriptionsRequest | PendingRpcSubscriptionsRequest<TNotification>} will
 * trigger the subscription and return a promise for an async iterable that vends `TNotifications`.
 */
export type PendingRpcSubscriptionsRequest<TNotification> = {
    subscribe(options: RpcSubscribeOptions): Promise<AsyncIterable<TNotification>>;
};

export type RpcSubscribeOptions = Readonly<{
    /** An `AbortSignal` to fire when you want to unsubscribe */
    abortSignal: AbortSignal;
}>;
