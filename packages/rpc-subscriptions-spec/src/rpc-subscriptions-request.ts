import { ReactiveStreamStore } from '@solana/subscribable';

/**
 * Pending subscriptions are the result of calling a supported method on a {@link RpcSubscriptions}
 * object. They encapsulate all of the information necessary to make the subscription without
 * actually making it.
 *
 * Calling the {@link PendingRpcSubscriptionsRequest.subscribe | `subscribe(options)`} method on a
 * {@link PendingRpcSubscriptionsRequest | PendingRpcSubscriptionsRequest<TNotification>} will
 * trigger the subscription and return a promise for an async iterable that vends `TNotifications`.
 *
 * Calling the {@link PendingRpcSubscriptionsRequest.reactiveStore | `reactiveStore()`} method
 * will return a {@link ReactiveStreamStore} compatible with `useSyncExternalStore`, Svelte
 * stores, and other reactive primitives. The returned store is in `status: 'idle'`; the caller
 * is responsible for invoking {@link ReactiveStreamStore.connect | `connect()`} to open the
 * underlying stream. Attach a caller-provided cancellation source via
 * {@link ReactiveStreamStore.withSignal | `withSignal()`}.
 */
export type PendingRpcSubscriptionsRequest<TNotification> = {
    /**
     * Synchronously returns a {@link ReactiveStreamStore} that holds the latest notification.
     * Compatible with `useSyncExternalStore` and other reactive primitives that expect a
     * `{ subscribe, getUnifiedState }` contract. The returned store is in `status: 'idle'` — call
     * {@link ReactiveStreamStore.connect | `connect()`} to open the subscription; a follow-up
     * `connect()` after an error reopens it. Attach a caller-provided cancellation source via
     * {@link ReactiveStreamStore.withSignal | `withSignal()`}.
     *
     * @example
     * ```ts
     * const store = rpc.accountNotifications(address).reactiveStore();
     * // Per-connection timeout — fresh clock per attempt:
     * store.withSignal(AbortSignal.timeout(30_000)).connect();
     * // React — the unified snapshot has stable identity per update.
     * const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
     * if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.connect} />;
     * if (state.status === 'loading' || state.status === 'idle') return <Spinner />;
     * return <View data={state.data} />;
     * ```
     */
    reactiveStore(): ReactiveStreamStore<TNotification>;
    /**
     * Triggers the subscription and returns a promise for an async iterable of notifications.
     * Use `for await...of` to consume notifications as they arrive. Abort the signal to
     * unsubscribe.
     *
     * @example
     * ```ts
     * const notifications = await rpc.accountNotifications(address).subscribe({ abortSignal });
     * for await (const notification of notifications) {
     *     console.log('Account changed:', notification);
     * }
     * ```
     */
    subscribe(options: RpcSubscribeOptions): Promise<AsyncIterable<TNotification>>;
};

export type RpcSubscribeOptions = Readonly<{
    /** An `AbortSignal` to fire when you want to unsubscribe */
    abortSignal: AbortSignal;
}>;

/**
 * Structural duck-type for anything subscribable via `subscribe({ abortSignal })`. Satisfied by
 * {@link PendingRpcSubscriptionsRequest | PendingRpcSubscriptionsRequest<TNotification>}.
 *
 * @typeParam TNotification - The notification type yielded by the returned async iterable.
 */
export type RpcSubscribable<TNotification> = {
    subscribe(options: RpcSubscribeOptions): Promise<AsyncIterable<TNotification>>;
};
