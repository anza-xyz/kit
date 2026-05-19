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
 * - The store transitions through `loading` until the first response or notification arrives,
 *   then to `loaded` with a {@link SolanaRpcResponse} containing the value and the slot context
 *   at which it was observed.
 * - On error from either source, the store transitions to `status: 'error'` preserving the last
 *   known value. Only the first error per connection window is captured.
 * - A subsequent `connect()` aborts the current connection, transitions back to
 *   `status: 'loading'` (preserving the last known `data` and `error` for stale-while-revalidate),
 *   and re-fires the RPC request and subscription with a fresh inner abort signal.
 * - {@link ReactiveStreamStore.reset | `reset()`} aborts the current connection and returns the
 *   store to `idle`, clearing `data` and `error`.
 * - Attach a caller-provided cancellation source via
 *   {@link ReactiveStreamStore.withSignal | `withSignal()`} — `store.withSignal(signal).connect()`
 *   composes the signal with the per-connection controller. Aborting the caller's signal
 *   transitions the store to `error` with that abort reason.
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
 * balanceStore.withSignal(AbortSignal.timeout(60_000)).connect();
 * ```
 *
 * @see {@link ReactiveStreamStore}
 */
export function createReactiveStoreWithInitialValueAndSlotTracking<TRpcValue, TSubscriptionValue, TItem>({
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

    function performConnect(callerSignal: AbortSignal | undefined) {
        // Abort any currently active connection before starting a fresh one.
        currentInnerController?.abort();
        // If the caller's signal is already aborted, surface as error and bail.
        if (callerSignal?.aborted) {
            setState({ data: currentState.data, error: callerSignal.reason, status: 'error' });
            return;
        }
        // Transition to `loading`, preserving the last known `data` and `error` for SWR. If
        // already `loading` with the same data/error, `setState` no-ops — no spurious notify.
        setState({ data: currentState.data, error: currentState.error, status: 'loading' });

        const innerController = new AbortController();
        currentInnerController = innerController;
        const innerSignal = innerController.signal;
        const signal = callerSignal ? AbortSignal.any([innerSignal, callerSignal]) : innerSignal;
        // Caller's signal aborting (not just supersede via the inner controller) transitions the
        // store to error with the caller's abort reason. Scoped to the inner signal so the
        // listener is removed on reconnect / reset.
        if (callerSignal) {
            callerSignal.addEventListener(
                'abort',
                () => {
                    if (innerSignal.aborted) return;
                    setState({ data: currentState.data, error: callerSignal.reason, status: 'error' });
                    innerController.abort(callerSignal.reason);
                },
                { signal: innerSignal },
            );
        }

        function handleError(err: unknown) {
            if (signal.aborted) return;
            if (currentState.status === 'error') return;
            setState({ data: currentState.data, error: err, status: 'error' });
            innerController.abort(err);
        }

        function handleValue(value: SolanaRpcResponse<TItem>) {
            setState({ data: value, error: undefined, status: 'loaded' });
        }

        rpcRequest
            .send({ abortSignal: signal })
            .then(({ context: { slot }, value }) => {
                if (signal.aborted) return;
                // `lastUpdateSlot` persists across reconnects so the store never regresses. If
                // the re-fetched RPC returns a slot older than one we've already seen, we wait
                // for the subscription to deliver something newer before leaving `loading`.
                if (slot < lastUpdateSlot) return;
                lastUpdateSlot = slot;
                handleValue({ context: { slot }, value: rpcValueMapper(value) });
            })
            .catch(handleError);

        rpcSubscriptionRequest
            .subscribe({ abortSignal: signal })
            .then(async notifications => {
                for await (const {
                    context: { slot },
                    value,
                } of notifications) {
                    if (signal.aborted) return;
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
        connect(): void {
            performConnect(undefined);
        },
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
            performConnect(undefined);
        },
        subscribe(callback: () => void): () => void {
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        },
        withSignal(signal: AbortSignal) {
            return {
                connect(): void {
                    performConnect(signal);
                },
            };
        },
    };
}
