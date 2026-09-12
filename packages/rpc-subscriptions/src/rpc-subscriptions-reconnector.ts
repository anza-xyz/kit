/**
 * Utilities for creating resilient subscriptions with automatic reconnection and message gap recovery.
 *
 * @packageDocumentation
 */

import type { RpcSubscriptionsApiMethods, RpcSubscriptionsPlan } from '@solana/rpc-subscriptions-spec';

/**
 * Configuration for backoff strategy when reconnecting.
 */
export type BackoffConfig = Readonly<{
    /**
     * The initial delay in milliseconds before the first retry.
     * @defaultValue 100
     */
    initialDelayMs?: number;

    /**
     * The maximum delay in milliseconds between retries.
     * @defaultValue 30000
     */
    maxDelayMs?: number;

    /**
     * The multiplier to apply to the delay for each retry (exponential backoff).
     * @defaultValue 2
     */
    backoffMultiplier?: number;

    /**
     * The maximum number of retry attempts before giving up.
     * If undefined, will retry indefinitely.
     */
    maxAttempts?: number;
}>;

/**
 * Configuration for a resilient subscription.
 */
export type ResilientSubscriptionConfig<TNotification> = Readonly<{
    /**
     * Factory function that creates a new subscription async iterator.
     * Called on initial subscribe and on each reconnection attempt.
     */
    onSubscribe: () => Promise<AsyncIterable<TNotification>>;

    /**
     * Optional callback invoked when a message gap is detected (subscription failed).
     * Should perform catch-up logic to recover missed messages.
     * The result is emitted as a notification before resuming normal subscriptions.
     */
    onGap?: () => Promise<TNotification | null>;

    /**
     * Configuration for the exponential backoff retry strategy.
     */
    backoffConfig?: BackoffConfig;
}>;

/**
 * Calculates the next delay for exponential backoff with jitter.
 *
 * @param attempt - The current attempt number (0-indexed)
 * @param config - The backoff configuration
 * @returns The delay in milliseconds
 *
 * @internal
 */
function calculateBackoffDelay(attempt: number, config: Required<BackoffConfig>): number {
    const exponentialDelay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs,
    );

    // Add jitter: random value between 0 and exponentialDelay
    const jitter = Math.random() * exponentialDelay;
    return exponentialDelay + jitter;
}

/**
 * Sleeps for the specified number of milliseconds.
 *
 * @param ms - Milliseconds to sleep
 * @param signal - Optional abort signal to interrupt the sleep
 * @returns Promise that resolves after the delay or when aborted
 *
 * @internal
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, ms);

        signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(signal.reason ?? new Error('Sleep aborted'));
        });
    });
}

/**
 * Creates a resilient subscription with automatic reconnection and message gap recovery.
 *
 * When the subscription fails (throws an error), this helper will:
 * 1. Call `onGap()` if provided to recover missed messages
 * 2. Wait using exponential backoff before retrying
 * 3. Re-invoke `onSubscribe()` to establish a new subscription
 * 4. Continue emitting notifications from the new subscription
 *
 * @typeParam TNotification - The type of notifications emitted by the subscription
 *
 * @param config - Configuration for the resilient subscription
 * @param abortSignal - Optional signal to abort the subscription
 * @returns An async iterable of notifications with automatic reconnection
 *
 * @example
 * ```ts
 * import { createResilientSubscription } from '@solana/rpc-subscriptions';
 * import { createSolanaRpcSubscriptions } from '@solana/kit';
 *
 * const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
 *
 * const subscription = createResilientSubscription({
 *   onSubscribe: async () =>
 *     rpcSubscriptions.accountNotifications(address, { commitment: 'confirmed' }).subscribe({
 *       abortSignal: new AbortController().signal,
 *     }),
 *   onGap: async () => {
 *     // Fetch latest balance to catch up on missed updates
 *     const { value } = await rpc.getBalance(address).send();
 *     return { value, executable: false, lamports: value, owner: address, data: new Uint8Array() };
 *   },
 *   backoffConfig: { maxAttempts: 10, initialDelayMs: 100 },
 * });

 * for await (const notification of subscription) {
 *   console.log('Account updated:', notification);
 * }
 * ```
 */
export async function* createResilientSubscription<TNotification>(
    config: ResilientSubscriptionConfig<TNotification>,
    abortSignal?: AbortSignal,
): AsyncGenerator<TNotification> {
    const backoffConfig: Required<BackoffConfig> = {
        initialDelayMs: config.backoffConfig?.initialDelayMs ?? 100,
        maxDelayMs: config.backoffConfig?.maxDelayMs ?? 30000,
        backoffMultiplier: config.backoffConfig?.backoffMultiplier ?? 2,
        maxAttempts: config.backoffConfig?.maxAttempts ?? Infinity,
    };

    let attempt = 0;

    while (attempt < backoffConfig.maxAttempts) {
        if (abortSignal?.aborted) {
            throw abortSignal.reason ?? new Error('Subscription aborted');
        }

        try {
            const iterator = await config.onSubscribe();

            attempt = 0; // Reset attempt counter on successful subscription

            for await (const notification of iterator) {
                if (abortSignal?.aborted) {
                    throw abortSignal.reason ?? new Error('Subscription aborted');
                }
                yield notification;
            }
        } catch (error) {
            if (abortSignal?.aborted) {
                throw abortSignal.reason ?? new Error('Subscription aborted');
            }

            // Handle message gap recovery
            if (config.onGap) {
                try {
                    const gapNotification = await config.onGap();
                    if (gapNotification !== null) {
                        yield gapNotification;
                    }
                } catch (gapError) {
                    // Log but don't throw - continue with reconnection
                    if (__DEV__) {
                        console.warn('Error recovering from gap:', gapError);
                    }
                }
            }

            // Calculate backoff and retry
            if (attempt < backoffConfig.maxAttempts - 1) {
                const delayMs = calculateBackoffDelay(attempt, backoffConfig);

                if (__DEV__) {
                    console.warn(
                        `Subscription failed (attempt ${attempt + 1}/${backoffConfig.maxAttempts}). Retrying in ${delayMs.toFixed(0)}ms...`,
                        error,
                    );
                }

                try {
                    await sleep(delayMs, abortSignal);
                } catch {
                    // Aborted during sleep
                    throw abortSignal?.reason ?? new Error('Subscription aborted');
                }

                attempt++;
            } else {
                // Max attempts reached
                throw new Error(
                    `Resilient subscription failed after ${backoffConfig.maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }
    }
}

/**
 * Coordinates recovery across multiple subscriptions after a network failure.
 *
 * This utility helps synchronize catch-up logic when multiple subscriptions fail simultaneously
 * (e.g., due to a network disconnect). It ensures that recovery functions are called in parallel
 * and any errors are collected and reported.
 *
 * @param recoveryFunctions - Array of async recovery functions to invoke
 * @param options - Optional configuration
 * @returns Promise resolving to any errors that occurred during recovery
 *
 * @example
 * ```ts
 * const errors = await coordinateSubscriptionRecovery(
 *   [
 *     () => rpc.getBalance(address1).send(),
 *     () => rpc.getBalance(address2).send(),
 *     () => rpc.getBalance(address3).send(),
 *   ],
 * );
 *
 * if (errors.length > 0) {
 *   console.warn('Some recoveries failed:', errors);
 * }
 * ```
 */
export async function coordinateSubscriptionRecovery(
    recoveryFunctions: readonly (() => Promise<unknown>)[],
    options?: Readonly<{ abortSignal?: AbortSignal }>,
): Promise<Error[]> {
    const errors: Error[] = [];

    const promises = recoveryFunctions.map(async fn => {
        try {
            if (options?.abortSignal?.aborted) {
                throw options.abortSignal.reason ?? new Error('Recovery aborted');
            }
            await fn();
        } catch (error) {
            errors.push(error instanceof Error ? error : new Error(String(error)));
        }
    });

    await Promise.all(promises);
    return errors;
}
