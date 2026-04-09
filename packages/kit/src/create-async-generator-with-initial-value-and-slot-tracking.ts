import type { PendingRpcRequest } from '@solana/rpc';
import type { PendingRpcSubscriptionsRequest } from '@solana/rpc-subscriptions';
import type { SolanaRpcResponse } from '@solana/rpc-types';

type CreateAsyncGeneratorWithInitialValueAndSlotTrackingConfig<TRpcValue, TSubscriptionValue, TItem> = Readonly<{
    /**
     * Triggering this abort signal will cancel the pending RPC request and subscription, and
     * cause the async generator to return (complete without error).
     */
    abortSignal: AbortSignal;
    /**
     * A pending RPC request whose response will be yielded as the generator's first value
     * (unless a subscription notification with a newer slot arrives first).
     * The response must be a {@link SolanaRpcResponse} so that its slot can be compared with
     * subscription notifications.
     */
    rpcRequest: PendingRpcRequest<SolanaRpcResponse<TRpcValue>>;
    /**
     * A pending RPC subscription request whose notifications will be yielded as they arrive.
     * Each notification must be a {@link SolanaRpcResponse} so that its slot can be compared
     * with the initial RPC response and other notifications.
     */
    rpcSubscriptionRequest: PendingRpcSubscriptionsRequest<SolanaRpcResponse<TSubscriptionValue>>;
    /**
     * Maps the value from a subscription notification to the item type yielded by the generator.
     */
    rpcSubscriptionValueMapper: (value: TSubscriptionValue) => TItem;
    /**
     * Maps the value from the RPC response to the item type yielded by the generator.
     */
    rpcValueMapper: (value: TRpcValue) => TItem;
}>;

/**
 * Creates an async generator that combines an initial RPC fetch with an ongoing subscription,
 * yielding values as they arrive from either source.
 *
 * The generator uses slot-based comparison to ensure that only the most recent values are yielded.
 * Any value at a slot older than a previously yielded value is silently dropped.
 * This prevents stale data from appearing when the RPC response and subscription notifications
 * arrive out of order.
 *
 * Things to note:
 *
 * - The generator yields {@link SolanaRpcResponse} values from both the RPC response and
 *   subscription notifications, each containing the slot context and the mapped value.
 * - Out-of-order values (by slot) are silently dropped — they are never yielded.
 * - On error from either source, the generator throws the error.
 * - Triggering the caller's abort signal causes the generator to return (complete without error).
 * - The generator completes when the subscription ends, an error occurs, or the abort signal fires.
 *
 * @param config
 *
 * @example
 * ```ts
 * import {
 *     address,
 *     createAsyncGeneratorWithInitialValueAndSlotTracking,
 *     createSolanaRpc,
 *     createSolanaRpcSubscriptions,
 * } from '@solana/kit';
 *
 * const rpc = createSolanaRpc('http://127.0.0.1:8899');
 * const rpcSubscriptions = createSolanaRpcSubscriptions('ws://127.0.0.1:8900');
 * const myAddress = address('FnHyam9w4NZoWR6mKN1CuGBritdsEWZQa4Z4oawLZGxa');
 *
 * const abortController = new AbortController();
 * for await (const balance of createAsyncGeneratorWithInitialValueAndSlotTracking({
 *     abortSignal: abortController.signal,
 *     rpcRequest: rpc.getBalance(myAddress, { commitment: 'confirmed' }),
 *     rpcValueMapper: lamports => lamports,
 *     rpcSubscriptionRequest: rpcSubscriptions.accountNotifications(myAddress),
 *     rpcSubscriptionValueMapper: ({ lamports }) => lamports,
 * })) {
 *     console.log(`Balance at slot ${balance.context.slot}:`, balance.value);
 * }
 * ```
 */
export async function* createAsyncGeneratorWithInitialValueAndSlotTracking<TRpcValue, TSubscriptionValue, TItem>({
    abortSignal,
    rpcRequest,
    rpcValueMapper,
    rpcSubscriptionRequest,
    rpcSubscriptionValueMapper,
}: CreateAsyncGeneratorWithInitialValueAndSlotTrackingConfig<TRpcValue, TSubscriptionValue, TItem>): AsyncGenerator<
    SolanaRpcResponse<TItem>
> {
    if (abortSignal.aborted) return;

    let lastUpdateSlot = -1n;

    // Shared queue for merging values from the RPC response and subscription notifications.
    const queue: SolanaRpcResponse<TItem>[] = [];
    let waitingResolve: ((value: IteratorResult<SolanaRpcResponse<TItem>>) => void) | null = null;
    let waitingReject: ((reason: unknown) => void) | null = null;
    let rpcDone = false;
    let subscriptionDone = false;
    let done = false;
    let pendingError: unknown;

    function markSourcesDone() {
        done = true;
        if (waitingResolve) {
            const resolve = waitingResolve;
            waitingResolve = null;
            resolve({ done: true, value: undefined });
        }
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    function onAbort() {
        done = true;
        abortController.abort(abortSignal.reason);
        if (waitingResolve) {
            const resolve = waitingResolve;
            waitingResolve = null;
            waitingReject = null;
            resolve({ done: true, value: undefined });
        }
    }
    abortSignal.addEventListener('abort', onAbort);

    function enqueue(item: SolanaRpcResponse<TItem>) {
        if (done || signal.aborted) return;
        if (waitingResolve) {
            // generator is waiting for a value, so resolve immediately
            const resolve = waitingResolve;
            waitingResolve = null;
            waitingReject = null;
            resolve({ done: false, value: item });
        } else {
            // No pending generator pull, so enqueue the item for future delivery
            queue.push(item);
        }
    }

    function handleError(err: unknown) {
        if (signal.aborted) return;
        done = true;
        pendingError = err;
        abortController.abort(err);
        if (waitingReject) {
            // generator is waiting for a value, so reject immediately
            const reject = waitingReject;
            waitingResolve = null;
            waitingReject = null;
            reject(err);
        }
    }

    // Start both sources concurrently.
    rpcRequest
        .send({ abortSignal: signal })
        .then(({ context: { slot }, value }) => {
            if (signal.aborted) return;
            if (slot < lastUpdateSlot) return;
            lastUpdateSlot = slot;
            enqueue({ context: { slot }, value: rpcValueMapper(value) });
        })
        .then(() => {
            rpcDone = true;
            if (subscriptionDone) markSourcesDone();
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
                enqueue({ context: { slot }, value: rpcSubscriptionValueMapper(value) });
            }
            // Subscription completed normally.
            subscriptionDone = true;
            if (rpcDone) markSourcesDone();
        })
        .catch(handleError);

    try {
        while (true) {
            if (pendingError) throw pendingError;
            if (queue.length > 0) {
                yield queue.shift()!;
            } else if (done) {
                return;
            } else {
                // if no value queued or error, wait for the next value or error
                const result: IteratorResult<SolanaRpcResponse<TItem>> = await new Promise((resolve, reject) => {
                    waitingResolve = resolve;
                    waitingReject = reject;
                });
                if (result.done) return;
                yield result.value;
            }
        }
    } finally {
        abortSignal.removeEventListener('abort', onAbort);
        if (!signal.aborted) {
            abortController.abort();
        }
    }
}
