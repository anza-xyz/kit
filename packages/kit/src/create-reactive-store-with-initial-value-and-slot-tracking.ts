import type { SolanaRpcResponse } from '@solana/rpc-types';
import type {
    ReactiveActionSource,
    ReactiveState,
    ReactiveStreamSource,
    ReactiveStreamStore,
} from '@solana/subscribable';

/**
 * Configuration for {@link createReactiveStoreWithInitialValueAndSlotTracking}. Pairs a one-shot
 * initial-value source with an ongoing stream source so the resulting store can hydrate from the
 * initial response and keep up to date with notifications, slot-deduplicating the two sources.
 *
 * @typeParam TInitialValue - The value type produced by `initialValueSource` (inside the {@link SolanaRpcResponse} envelope).
 * @typeParam TStreamValue - The value type emitted by `streamSource` (inside the {@link SolanaRpcResponse} envelope).
 * @typeParam TItem - The unified item type the store holds, produced by the two value mappers.
 *
 * @see {@link createReactiveStoreWithInitialValueAndSlotTracking}
 */
export type CreateReactiveStoreWithInitialValueAndSlotTrackingConfig<TInitialValue, TStreamValue, TItem> = Readonly<{
    /**
     * Maps the value from the initial-value source's response to the item type stored in the
     * reactive store.
     */
    initialValueMapper: (value: TInitialValue) => TItem;
    /**
     * A reactive action source whose dispatched value will be used to set the store's initial
     * state. The value must be a {@link SolanaRpcResponse} so that its slot can be compared with
     * stream notifications. Satisfied by `PendingRpcRequest`.
     */
    initialValueSource: ReactiveActionSource<SolanaRpcResponse<TInitialValue>>;
    /**
     * A reactive stream source whose notifications will be used to keep the store up to date. Each
     * notification must be a {@link SolanaRpcResponse} so that its slot can be compared with the
     * initial value and with other notifications. Satisfied by `PendingRpcSubscriptionsRequest`.
     */
    streamSource: ReactiveStreamSource<SolanaRpcResponse<TStreamValue>>;
    /**
     * Maps the value from a stream notification to the item type stored in the reactive store.
     */
    streamValueMapper: (value: TStreamValue) => TItem;
}>;

const IDLE_STATE: ReactiveState<never> = Object.freeze({
    data: undefined,
    error: undefined,
    status: 'idle',
});

/**
 * Creates a {@link ReactiveStreamStore} that combines an initial one-shot fetch with an ongoing
 * stream to keep its state up to date.
 *
 * The store uses slot-based comparison to ensure that only the most recent value is kept,
 * regardless of whether it came from the initial value source or a stream notification. This
 * prevents stale data from overwriting newer data when the two sources arrive out of order.
 *
 * The two sources are consumed via their {@link ReactiveActionSource.reactiveStore | `reactiveStore()`}
 * methods rather than by calling `send()` / `subscribe()` directly, so any object satisfying the
 * {@link ReactiveActionSource} / {@link ReactiveStreamSource} duck-types works — including
 * `PendingRpcRequest` / `PendingRpcSubscriptionsRequest` and plugin-authored wrappers.
 *
 * Things to note:
 *
 * - The returned store starts in `status: 'idle'`. Call
 *   {@link ReactiveStreamStore.connect | `connect()`} to dispatch the initial-value source and open
 *   the stream.
 * - The store transitions through `loading` until the first value or notification arrives,
 *   then to `loaded` with a {@link SolanaRpcResponse} containing the value and the slot context
 *   at which it was observed.
 * - On error from either source, the store transitions to `status: 'error'` preserving the last
 *   known value. Only the first error per connection window is captured.
 * - A subsequent `connect()` aborts the current connection, transitions back to
 *   `status: 'loading'` (preserving the last known `data` and `error` for stale-while-revalidate),
 *   and re-builds both inner stores with a fresh inner abort signal.
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
 *     initialValueSource: rpc.getBalance(myAddress, { commitment: 'confirmed' }),
 *     initialValueMapper: lamports => lamports,
 *     streamSource: rpcSubscriptions.accountNotifications(myAddress),
 *     streamValueMapper: ({ lamports }) => lamports,
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
export function createReactiveStoreWithInitialValueAndSlotTracking<TInitialValue, TStreamValue, TItem>({
    initialValueMapper,
    initialValueSource,
    streamSource,
    streamValueMapper,
}: CreateReactiveStoreWithInitialValueAndSlotTrackingConfig<TInitialValue, TStreamValue, TItem>): ReactiveStreamStore<
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

        // `lastUpdateSlot` persists across reconnects so the surfaced value never regresses.
        function handleSlottedValue({ context: { slot }, value }: SolanaRpcResponse<TItem>) {
            if (signal.aborted) return;
            if (slot < lastUpdateSlot) {
                // Stale slot: keep the newer `data` we already hold, but still set `loaded`.
                if (currentState.data !== undefined) {
                    setState({ data: currentState.data, error: undefined, status: 'loaded' });
                }
                return;
            }
            lastUpdateSlot = slot;
            setState({ data: { context: { slot }, value }, error: undefined, status: 'loaded' });
        }

        // Build fresh inner stores for this connection window and forward their state into the
        // unified store. Drive both with the composed signal so they tear down when this connection
        // window does.
        const actionStore = initialValueSource.reactiveStore();
        const streamStore = streamSource.reactiveStore();

        const unsubscribeAction = actionStore.subscribe(() => {
            const state = actionStore.getState();
            if (state.status === 'success') {
                const { context, value } = state.data;
                handleSlottedValue({ context, value: initialValueMapper(value) });
            } else if (state.status === 'error') {
                handleError(state.error);
            }
        });
        const unsubscribeStream = streamStore.subscribe(() => {
            const state = streamStore.getUnifiedState();
            if (state.status === 'loaded') {
                const { context, value } = state.data;
                handleSlottedValue({ context, value: streamValueMapper(value) });
            } else if (state.status === 'error') {
                handleError(state.error);
            }
        });

        // Stop observing this connection's inner stores once it is superseded or the caller
        // aborts.
        // Note: don't call reset here, causes a race with the abort reason
        innerSignal.addEventListener(
            'abort',
            () => {
                unsubscribeAction();
                unsubscribeStream();
            },
            { once: true },
        );

        streamStore.withSignal(signal).connect();
        actionStore.withSignal(signal).dispatch();
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
