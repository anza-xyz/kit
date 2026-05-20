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
 * Calling the {@link PendingRpcSubscriptionsRequest.reactiveStore | `reactiveStore(options)`}
 * method will return a {@link ReactiveStreamStore} compatible with `useSyncExternalStore`, Svelte
 * stores, and other reactive primitives.
 */
export type PendingRpcSubscriptionsRequest<TNotification> = {
    /**
     * Triggers the subscription and returns a promise for a {@link ReactiveStreamStore} that holds
     * the latest notification. Compatible with `useSyncExternalStore` and other reactive primitives
     * that expect a `{ subscribe, getState }` contract.
     *
     * @example
     * ```ts
     * const store = await rpc.accountNotifications(address).reactive({ abortSignal });
     * // React — throw error from snapshot to surface via Error Boundary
     * const state = useSyncExternalStore(store.subscribe, () => {
     *     if (store.getError()) throw store.getError();
     *     return store.getState();
     * });
     * ```
     *
     * @deprecated Use {@link PendingRpcSubscriptionsRequest.reactiveStore | `reactiveStore()`}
     * instead. The synchronous variant returns a store that reconnects on
     * {@link ReactiveStreamStore.retry | `retry()`} after an error, whereas the store returned by
     * `reactive()` cannot recover once its underlying `DataPublisher` has failed.
     */
    reactive(options: RpcSubscribeOptions): Promise<ReactiveStreamStore<TNotification>>;
    /**
     * Synchronously returns a {@link ReactiveStreamStore} that subscribes in the background and
     * holds the latest notification. Compatible with `useSyncExternalStore` and other reactive
     * primitives that expect a `{ subscribe, getUnifiedState }` contract. The store opens a fresh
     * subscription on construction and on every {@link ReactiveStreamStore.retry | `retry()`}.
     *
     * @example
     * ```ts
     * const store = rpc.accountNotifications(address).reactiveStore({ abortSignal });
     * // React — the unified snapshot has stable identity per update.
     * const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
     * if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.retry} />;
     * if (state.status === 'loading') return <Spinner />;
     * return <View data={state.data} />;
     * ```
     */
    reactiveStore(options: RpcSubscribeOptions): ReactiveStreamStore<TNotification>;
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
