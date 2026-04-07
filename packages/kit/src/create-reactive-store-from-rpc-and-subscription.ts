import type { PendingRpcRequest } from '@solana/rpc';
import type { PendingRpcSubscriptionsRequest } from '@solana/rpc-subscriptions';
import type { SolanaRpcResponse } from '@solana/rpc-types';
import type { ReactiveStore } from '@solana/subscribable';

type CreateReactiveStoreFromRpcAndSubscriptionConfig<TRpcValue, TSubscriptionValue, TItem> = Readonly<{
    /**
     * Triggering this abort signal will cancel the pending RPC request and subscription, and
     * disconnect the store from further updates.
     */
    abortSignal: AbortSignal;
    /**
     * A pending RPC request whose response will be used to set the store's initial state.
     * The response must be a {@link SolanaRpcResponse} so that its slot can be compared with
     * subscription notifications.
     */
    rpcRequest: PendingRpcRequest<SolanaRpcResponse<TRpcValue>>;
    /**
     * Maps the value from the RPC response to the item type stored in the reactive store.
     */
    rpcValueMapper: (value: TRpcValue) => TItem;
    /**
     * A pending RPC subscription request whose notifications will be used to keep the store
     * up to date. Each notification must be a {@link SolanaRpcResponse} so that its slot can be
     * compared with the initial RPC response and other notifications.
     */
    subscriptionRequest: PendingRpcSubscriptionsRequest<SolanaRpcResponse<TSubscriptionValue>>;
    /**
     * Maps the value from a subscription notification to the item type stored in the reactive store.
     */
    subscriptionValueMapper: (value: TSubscriptionValue) => TItem;
}>;

/**
 * Creates a {@link ReactiveStore} that combines an initial RPC fetch with an ongoing subscription
 * to keep its state up to date.
 *
 * The store uses slot-based comparison to ensure that only the most recent value is kept,
 * regardless of whether it came from the initial RPC response or a subscription notification.
 * This prevents stale data from overwriting newer data when the RPC response and subscription
 * notifications arrive out of order.
 *
 * Things to note:
 *
 * - `getState()` returns `undefined` until the first response or notification arrives.
 * - On error from either source, `getState()` continues to return the last known value and
 *   `getError()` returns the error. Only the first error is captured.
 * - When an error occurs, the abort signal is triggered, cancelling both the RPC request and
 *   the subscription.
 * - Triggering the caller's abort signal disconnects the store from both sources.
 *
 * @param config
 *
 * @example
 * ```ts
 * import {
 *     address,
 *     createReactiveStoreFromRpcAndSubscription,
 *     createSolanaRpc,
 *     createSolanaRpcSubscriptions,
 * } from '@solana/kit';
 *
 * const rpc = createSolanaRpc('http://127.0.0.1:8899');
 * const rpcSubscriptions = createSolanaRpcSubscriptions('ws://127.0.0.1:8900');
 * const myAddress = address('FnHyam9w4NZoWR6mKN1CuGBritdsEWZQa4Z4oawLZGxa');
 *
 * const balanceStore = createReactiveStoreFromRpcAndSubscription({
 *     abortSignal: AbortSignal.timeout(60_000),
 *     rpcRequest: rpc.getBalance(myAddress, { commitment: 'confirmed' }),
 *     rpcValueMapper: lamports => lamports,
 *     subscriptionRequest: rpcSubscriptions.accountNotifications(myAddress),
 *     subscriptionValueMapper: ({ lamports }) => lamports,
 * });
 *
 * const unsubscribe = balanceStore.subscribe(() => {
 *     const error = balanceStore.getError();
 *     if (error) console.error('Error:', error);
 *     else console.log('Balance:', balanceStore.getState());
 * });
 * ```
 *
 * @see {@link ReactiveStore}
 */
export function createReactiveStoreFromRpcAndSubscription<TRpcValue, TSubscriptionValue, TItem>({
    abortSignal,
    rpcRequest,
    rpcValueMapper,
    subscriptionRequest,
    subscriptionValueMapper,
}: CreateReactiveStoreFromRpcAndSubscriptionConfig<TRpcValue, TSubscriptionValue, TItem>): ReactiveStore<TItem> {
    let currentState: TItem | undefined;
    let currentError: unknown;
    let lastUpdateSlot = -1n;
    const subscribers = new Set<() => void>();

    const abortController = new AbortController();
    abortSignal.addEventListener('abort', () => abortController.abort(abortSignal.reason));
    const signal = abortController.signal;

    function notifySubscribers() {
        subscribers.forEach(cb => cb());
    }

    function handleError(err: unknown) {
        // Ignore if the signal has already been aborted
        if (signal.aborted) return;
        // Only capture the first error
        if (currentError !== undefined) return;
        currentError = err;
        abortController.abort(err);
        notifySubscribers();
    }

    rpcRequest
        .send({ abortSignal: signal })
        .then(({ context: { slot }, value }) => {
            if (slot < lastUpdateSlot) return;
            lastUpdateSlot = slot;
            currentState = rpcValueMapper(value);
            notifySubscribers();
        })
        .catch(handleError);

    subscriptionRequest
        .subscribe({ abortSignal: signal })
        .then(async notifications => {
            for await (const {
                context: { slot },
                value,
            } of notifications) {
                if (slot < lastUpdateSlot) continue;
                lastUpdateSlot = slot;
                currentState = subscriptionValueMapper(value);
                notifySubscribers();
            }
        })
        .catch(handleError);

    return {
        getError(): unknown {
            return currentError;
        },
        getState(): TItem | undefined {
            return currentState;
        },
        subscribe(callback: () => void): () => void {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
    };
}
