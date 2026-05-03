import type { PendingRpcRequest } from '@solana/rpc';
import type { PendingRpcSubscriptionsRequest } from '@solana/rpc-subscriptions';
import type { SolanaRpcResponse } from '@solana/rpc-types';
import type { ReactiveState, ReactiveStore } from '@solana/subscribable';

type CreateReactiveStoreWithInitialValueAndSlotTrackingConfig<TRpcValue, TSubscriptionValue, TItem> = Readonly<{
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
     * A pending RPC subscription request whose notifications will be used to keep the store
     * up to date. Each notification must be a {@link SolanaRpcResponse} so that its slot can be
     * compared with the initial RPC response and other notifications.
     */
    rpcSubscriptionRequest: PendingRpcSubscriptionsRequest<SolanaRpcResponse<TSubscriptionValue>>;
    /**
     * Maps the value from a subscription notification to the item type stored in the reactive store.
     */
    rpcSubscriptionValueMapper: (value: TSubscriptionValue) => TItem;
    /**
     * Maps the value from the RPC response to the item type stored in the reactive store.
     */
    rpcValueMapper: (value: TRpcValue) => TItem;
}>;

const LOADING_STATE: ReactiveState<never> = Object.freeze({
    data: undefined,
    error: undefined,
    status: 'loading',
});

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
 * - `getUnifiedState()` starts in `status: 'loading'` until the first response or notification
 *   arrives. Once data arrives it transitions to `status: 'loaded'` with a
 *   {@link SolanaRpcResponse} containing the value and the slot context at which it was observed.
 * - On error from either source, the store transitions to `status: 'error'` preserving the last
 *   known value. Only the first error per connection window is captured.
 * - Calling {@link ReactiveStore.retry | `retry()`} while in `status: 'error'` re-sends the RPC
 *   request and re-subscribes to the subscription using a fresh inner abort signal. The store
 *   transitions through `status: 'retrying'` back to `loaded`/`error`.
 * - Triggering the caller's abort signal disconnects the store permanently; subsequent `retry()`
 *   calls are no-ops.
 *
 * @param config
 *
 * @example
 * ```ts
 * import {
 *     address,
 *     createReactiveStoreWithInitialValueAndSlotTracking,
 *     createSolanaRpc,
 *     createSolanaRpcSubscriptions,
 * } from '@solana/kit';
 *
 * const rpc = createSolanaRpc('http://127.0.0.1:8899');
 * const rpcSubscriptions = createSolanaRpcSubscriptions('ws://127.0.0.1:8900');
 * const myAddress = address('FnHyam9w4NZoWR6mKN1CuGBritdsEWZQa4Z4oawLZGxa');
 *
 * const balanceStore = createReactiveStoreWithInitialValueAndSlotTracking({
 *     abortSignal: AbortSignal.timeout(60_000),
 *     rpcRequest: rpc.getBalance(myAddress, { commitment: 'confirmed' }),
 *     rpcValueMapper: lamports => lamports,
 *     rpcSubscriptionRequest: rpcSubscriptions.accountNotifications(myAddress),
 *     rpcSubscriptionValueMapper: ({ lamports }) => lamports,
 * });
 *
 * const unsubscribe = balanceStore.subscribe(() => {
 *     const state = balanceStore.getUnifiedState();
 *     if (state.status === 'error') {
 *         console.error('Error:', state.error);
 *         balanceStore.retry();
 *     } else if (state.status === 'loaded') {
 *         console.log(`Balance at slot ${state.data.context.slot}:`, state.data.value);
 *     }
 * });
 * ```
 *
 * @see {@link ReactiveStore}
 */
export function createReactiveStoreWithInitialValueAndSlotTracking<TRpcValue, TSubscriptionValue, TItem>({
    abortSignal,
    rpcRequest,
    rpcValueMapper,
    rpcSubscriptionRequest,
    rpcSubscriptionValueMapper,
}: CreateReactiveStoreWithInitialValueAndSlotTrackingConfig<TRpcValue, TSubscriptionValue, TItem>): ReactiveStore<
    SolanaRpcResponse<TItem>
> {
    let currentState: ReactiveState<SolanaRpcResponse<TItem>> = LOADING_STATE;
    let lastUpdateSlot = -1n;
    const subscribers = new Set<() => void>();

    const outerController = new AbortController();
    abortSignal.addEventListener('abort', () => outerController.abort(abortSignal.reason));

    function notify() {
        subscribers.forEach(cb => cb());
    }

    function connect() {
        if (outerController.signal.aborted) return;
        const innerController = new AbortController();
        const forwardAbort = () => innerController.abort(outerController.signal.reason);
        outerController.signal.addEventListener('abort', forwardAbort, { signal: innerController.signal });
        const innerSignal = innerController.signal;

        function handleError(err: unknown) {
            if (innerSignal.aborted) return;
            if (currentState.status === 'error') return;
            currentState = { data: currentState.data, error: err, status: 'error' };
            innerController.abort(err);
            notify();
        }

        function handleValue(value: SolanaRpcResponse<TItem>) {
            currentState = { data: value, error: undefined, status: 'loaded' };
            notify();
        }

        rpcRequest
            .send({ abortSignal: innerSignal })
            .then(({ context: { slot }, value }) => {
                if (innerSignal.aborted) return;
                // `lastUpdateSlot` persists across retries so the store never regresses. If the
                // retried RPC returns a slot older than one we've already seen, we wait for the
                // subscription to deliver something newer before leaving `retrying`.
                if (slot < lastUpdateSlot) return;
                lastUpdateSlot = slot;
                handleValue({ context: { slot }, value: rpcValueMapper(value) });
            })
            .catch(handleError);

        rpcSubscriptionRequest
            .subscribe({ abortSignal: innerSignal })
            .then(async notifications => {
                for await (const {
                    context: { slot },
                    value,
                } of notifications) {
                    if (innerSignal.aborted) return;
                    if (slot < lastUpdateSlot) continue;
                    lastUpdateSlot = slot;
                    handleValue({ context: { slot }, value: rpcSubscriptionValueMapper(value) });
                }
            })
            .catch(handleError);
    }

    connect();

    return {
        getError(): unknown {
            return currentState.error;
        },
        getState(): SolanaRpcResponse<TItem> | undefined {
            return currentState.data;
        },
        getUnifiedState(): ReactiveState<SolanaRpcResponse<TItem>> {
            return currentState;
        },
        retry(): void {
            if (outerController.signal.aborted) return;
            if (currentState.status !== 'error') return;
            currentState = { data: currentState.data, error: undefined, status: 'retrying' };
            notify();
            connect();
        },
        subscribe(callback: () => void): () => void {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
    };
}
