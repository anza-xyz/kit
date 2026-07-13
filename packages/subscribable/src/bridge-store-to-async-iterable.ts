import { SOLANA_ERROR__SUBSCRIBABLE__STREAM_CLOSED_WITHOUT_ERROR, SolanaError } from '@solana/errors';

import { ReactiveStreamStore } from './reactive-stream-store';

/**
 * Adapts a {@link ReactiveStreamStore} into an `AsyncIterable`, so a *push*-based reactive store can
 * be driven by *pull*-based code that consumes a stream by `for await`-ing it — for example TanStack
 * Query's `experimental_streamedQuery`.
 *
 * The bridge only *observes* the store; it does not open or tear down the connection. Just like every
 * other consumer in this ecosystem — a store does nothing until you `connect()` it — the caller owns
 * the store's lifecycle: `connect()` the store yourself (typically binding the same `signal` via
 * {@link ReactiveStreamStore.withSignal | `withSignal()`}), and `reset()` it when you're done if you
 * intend to reuse it. The bridge subscribes, yields the store's current and subsequent values, and
 * unsubscribes when iteration ends.
 *
 * This is the store-backed counterpart to {@link createAsyncIterableFromDataPublisher}. That helper
 * turns a raw {@link DataPublisher} directly into an `AsyncIterable` and queues every message so
 * none are dropped; use it when you have a publisher and no store. `bridgeStoreToAsyncIterable`
 * instead sits on top of a `ReactiveStreamStore`, so it reflects the store's unified
 * `idle`/`loading`/`loaded`/`error` lifecycle and its stale-while-revalidate behaviour — and,
 * because a store only ever holds the *latest* snapshot, it is latest-wins rather than fully
 * buffered. Note this is also distinct from an RPC subscription's own `AsyncIterable`
 * (`await rpcSubscriptions.someNotifications().subscribe(...)`), which vends messages straight off
 * the transport without a store in between.
 *
 * On iteration it seeds from the store's current snapshot, then yields its lifecycle:
 * - `loaded` → yields the value (the one already present when iteration begins, then each subsequent
 *   update), unless an optional `shouldYield` predicate rejects it. Latest-wins: if several
 *   notifications land between pulls, only the most recent unconsumed value is yielded (a
 *   subscription consumer wants the freshest state, not a backlog).
 * - `error` → throws, so the consuming `for await` rejects. Substitutes a
 *   {@link SOLANA_ERROR__SUBSCRIBABLE__STREAM_CLOSED_WITHOUT_ERROR} sentinel when the store reports
 *   an error with a nullish payload. An error takes precedence over a buffered value: if a `loaded`
 *   value is still pending when an `error` arrives, that value is dropped and the error propagates
 *   (once errored, stop yielding).
 * - `signal` aborts → ends the iterable cleanly (no error). A subscription never completes on its
 *   own, so `signal` is how the iterable terminates: aborting it unblocks a parked `for await` and
 *   ends the loop. Bind the same signal to the store's connection
 *   (`store.withSignal(signal).connect()`) so the abort tears the underlying stream down too.
 *
 * However iteration ends — value exhaustion, error, or abort — the bridge unsubscribes from the
 * store. It does not `reset()` the store; that is the caller's decision.
 *
 * @typeParam T - The notification type emitted by the store.
 *
 * @param store - A stream store to observe. Connect it yourself — the bridge does not.
 * @param signal - Terminates the iterable when aborted. Bind it to the store's connection too
 *   (`store.withSignal(signal).connect()`) so an abort also tears down the underlying stream.
 * @param shouldYield - Optional gate run against each `loaded` value before it is yielded. Return
 *   `false` to drop the value. When omitted, every loaded value is yielded.
 *
 * @returns An `AsyncIterable<T>` that yields each store value until the store errors or `signal`
 *   aborts.
 *
 * @throws Rethrows the store's `error` payload when the store transitions to `status: 'error'`, or a
 *   {@link SolanaError} with code {@link SOLANA_ERROR__SUBSCRIBABLE__STREAM_CLOSED_WITHOUT_ERROR}
 *   when that payload is nullish.
 *
 * @example
 * ```ts
 * const store = rpcSubscriptions.slotNotifications().reactiveStore();
 * const controller = new AbortController();
 * // The caller owns the connection — bind it to the same signal so an abort tears it down.
 * store.withSignal(controller.signal).connect();
 * try {
 *     for await (const notification of bridgeStoreToAsyncIterable(store, controller.signal)) {
 *         console.log('Latest slot:', notification.slot);
 *     }
 * } catch (e) {
 *     console.error('The subscription errored', e);
 * } finally {
 *     store.reset();
 * }
 * // Elsewhere: controller.abort() ends the loop cleanly.
 * ```
 *
 * @see {@link ReactiveStreamStore}
 * @see {@link createAsyncIterableFromDataPublisher}
 */
export function bridgeStoreToAsyncIterable<T>(
    store: ReactiveStreamStore<T>,
    signal: AbortSignal,
    shouldYield?: (value: T) => boolean,
): AsyncIterable<T> {
    return {
        async *[Symbol.asyncIterator](): AsyncIterator<T> {
            // Latest-wins single-slot buffer plus a one-shot "something changed" deferred the loop
            // parks on. `wake()` resolves the current deferred and arms a fresh one for the next park.
            let latest: { readonly value: T } | undefined;
            let failure: { readonly error: unknown } | undefined;
            let deferred = Promise.withResolvers<void>();
            const wake = () => {
                const { resolve } = deferred;
                deferred = Promise.withResolvers<void>();
                resolve();
            };

            const onChange = () => {
                const state = store.getState();
                if (state.status === 'loaded') {
                    // Drop a value the gate rejects. The stream parks again rather than yielding it.
                    if (shouldYield && !shouldYield(state.data)) return;
                    latest = { value: state.data };
                    wake();
                } else if (state.status === 'error') {
                    // A nullish error would otherwise surface as a value-less success; substitute a
                    // sentinel so the failure propagates.
                    failure = {
                        error: state.error ?? new SolanaError(SOLANA_ERROR__SUBSCRIBABLE__STREAM_CLOSED_WITHOUT_ERROR),
                    };
                    wake();
                }
                // `idle` / `loading` carry no value and no error — nothing to yield.
            };

            const onAbort = () => wake();
            signal.addEventListener('abort', onAbort, { once: true });
            const unsubscribe = store.subscribe(onChange);
            // Seed from the store's current snapshot: the caller may already have connected (and a
            // value or error may already be present) before iteration began. The bridge never
            // connects the store itself.
            onChange();
            try {
                while (true) {
                    // Abort wins over everything: an abort is teardown, so end cleanly without
                    // surfacing the store's incidental abort-driven error state.
                    if (signal.aborted) return;
                    if (failure) throw failure.error;
                    if (latest) {
                        const { value } = latest;
                        latest = undefined;
                        yield value;
                        continue;
                    }
                    await deferred.promise;
                }
            } finally {
                signal.removeEventListener('abort', onAbort);
                unsubscribe();
            }
        },
    };
}
