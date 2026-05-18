import type { PendingRpcRequest } from '@solana/rpc';
import type { PendingRpcSubscriptionsRequest } from '@solana/rpc-subscriptions';
import type { SolanaRpcResponse } from '@solana/rpc-types';
import type { ReactiveState, ReactiveStreamStore } from '@solana/subscribable';

/**
 * Configuration for {@link createReactiveStoreWithInitialValueAndSlotTracking}. Pairs a one-shot
 * RPC fetch with an ongoing subscription so the resulting store can hydrate from the initial
 * response and keep up to date with notifications, slot-deduplicating the two streams.
 *
 * @typeParam TRpcValue - The value type returned by `rpcRequest` (inside the {@link SolanaRpcResponse} envelope).
 * @typeParam TSubscriptionValue - The value type emitted by `rpcSubscriptionRequest` (inside the {@link SolanaRpcResponse} envelope).
 * @typeParam TItem - The unified item type the store holds, produced by the two value mappers.
 *
 * @see {@link createReactiveStoreWithInitialValueAndSlotTracking}
 */
export type CreateReactiveStoreWithInitialValueAndSlotTrackingConfig<TRpcValue, TSubscriptionValue, TItem> = Readonly<{
    /**
     * Triggering this abort signal will cancel any in-flight RPC request and subscription, and
     * permanently disconnect the store from further updates. Subsequent
     * {@link ReactiveStreamStore.connect | `connect()`} calls become no-ops.
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

const IDLE_STATE: ReactiveState<never> = Object.freeze({
    data: undefined,
    error: undefined,
    status: 'idle',
});

/**
 * Creates a {@link ReactiveStreamStore} that combines an initial RPC fetch with an ongoing subscription
 * to keep its state up to date.
 *
 * The store uses slot-based comparison to ensure that only the most recent value is kept,
 * regardless of whether it came from the initial RPC response or a subscription notification.
 * This prevents stale data from overwriting newer data when the RPC response and subscription
 * notifications arrive out of order.
 *
 * Things to note:
 *
 * - The returned store starts in `status: 'idle'`. Call
 *   {@link ReactiveStreamStore.connect | `connect()`} to fire the RPC request and open the
 *   subscription.
 * - From `idle`, the store transitions through `loading` until the first response or notification
 *   arrives, then to `loaded` with a {@link SolanaRpcResponse} containing the value and the slot
 *   context at which it was observed.
 * - On error from either source, the store transitions to `status: 'error'` preserving the last
 *   known value. Only the first error per connection window is captured.
 * - A subsequent `connect()` after `loaded` or `error` aborts the current connection, transitions
 *   through `status: 'retrying'` (preserving stale data), and re-fires the RPC request and
 *   subscription with a fresh inner abort signal.
 * - {@link ReactiveStreamStore.reset | `reset()`} aborts the current connection and returns the
 *   store to `idle`, clearing `data` and `error`.
 * - Triggering the caller's `abortSignal` disconnects the store permanently; subsequent `connect()`
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
 *         balanceStore.connect();
 *     } else if (state.status === 'loaded') {
 *         console.log(`Balance at slot ${state.data.context.slot}:`, state.data.value);
 *     }
 * });
 * balanceStore.connect();
 * ```
 *
 * @see {@link ReactiveStreamStore}
 */
export function createReactiveStoreWithInitialValueAndSlotTracking<TRpcValue, TSubscriptionValue, TItem>({
    abortSignal,
    rpcRequest,
    rpcValueMapper,
    rpcSubscriptionRequest,
    rpcSubscriptionValueMapper,
}: CreateReactiveStoreWithInitialValueAndSlotTrackingConfig<TRpcValue, TSubscriptionValue, TItem>): ReactiveStreamStore<
    SolanaRpcResponse<TItem>
> {
    let currentState: ReactiveState<SolanaRpcResponse<TItem>> = IDLE_STATE;
    let lastUpdateSlot = -1n;
    let currentInnerController: AbortController | undefined;
    const subscribers = new Set<() => void>();

    const outerController = new AbortController();
    abortSignal.addEventListener('abort', () => outerController.abort(abortSignal.reason));

    function notify() {
        subscribers.forEach(cb => cb());
    }

    function setState(next: ReactiveState<SolanaRpcResponse<TItem>>) {
        if (
            currentState.status === next.status &&
            currentState.data === next.data &&
            currentState.error === next.error
        ) {
            return;
        }
        currentState = next;
        notify();
    }

    function performConnect() {
        if (outerController.signal.aborted) return;
        // Abort any currently active connection before starting a fresh one.
        currentInnerController?.abort();
        // Transition based on whether we have prior data/error to preserve.
        if (currentState.status === 'idle') {
            setState({ data: undefined, error: undefined, status: 'loading' });
        } else {
            setState({ data: currentState.data, error: undefined, status: 'retrying' });
        }

        const innerController = new AbortController();
        currentInnerController = innerController;
        const forwardAbort = () => innerController.abort(outerController.signal.reason);
        outerController.signal.addEventListener('abort', forwardAbort, { signal: innerController.signal });
        const innerSignal = innerController.signal;

        function handleError(err: unknown) {
            if (innerSignal.aborted) return;
            if (currentState.status === 'error') return;
            setState({ data: currentState.data, error: err, status: 'error' });
            innerController.abort(err);
        }

        function handleValue(value: SolanaRpcResponse<TItem>) {
            setState({ data: value, error: undefined, status: 'loaded' });
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

    function performReset() {
        currentInnerController?.abort();
        currentInnerController = undefined;
        // `lastUpdateSlot` resets too — a fresh connect() starts a new slot window.
        lastUpdateSlot = -1n;
        setState(IDLE_STATE);
    }

    return {
        connect: performConnect,
        getError(): unknown {
            return currentState.error;
        },
        getState(): SolanaRpcResponse<TItem> | undefined {
            return currentState.data;
        },
        getUnifiedState(): ReactiveState<SolanaRpcResponse<TItem>> {
            return currentState;
        },
        reset: performReset,
        retry(): void {
            if (currentState.status !== 'error') return;
            performConnect();
        },
        subscribe(callback: () => void): () => void {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
    };
}
