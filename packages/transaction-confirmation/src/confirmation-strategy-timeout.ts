import type { Commitment } from '@solana/rpc-types';

type Config = Readonly<{
    abortSignal: AbortSignal;
    /**
     * The timeout promise will throw after 30 seconds when the commitment is `processed`, and 60
     * seconds otherwise.
     */
    commitment: Commitment;
}>;

/**
 * When no other heuristic exists to infer that a transaction has expired, you can use this promise
 * factory with a commitment level. It throws after 30 seconds when the commitment is `processed`,
 * and 60 seconds otherwise. You would typically race this with another confirmation strategy.
 *
 * @param config
 *
 * @example
 * ```ts
 * import { safeRace } from '@solana/promises';
 * import { getTimeoutPromise } from '@solana/transaction-confirmation';
 *
 * try {
 *     await safeRace([getCustomTransactionConfirmationPromise(/* ... *\/), getTimeoutPromise({ commitment })]);
 * } catch (e) {
 *     if (e instanceof DOMException && e.name === 'TimeoutError') {
 *         console.log('Could not confirm transaction after a timeout');
 *     }
 *     throw e;
 * }
 * ```
 */
export async function getTimeoutPromise({ abortSignal: callerAbortSignal, commitment }: Config) {
    return await new Promise((_, reject) => {
        const handleAbort = (e: AbortSignalEventMap['abort']) => {
            clearTimeout(timeoutId);
            const abortError = new DOMException((e.target as AbortSignal).reason, 'AbortError');
            reject(abortError);
        };
        callerAbortSignal.addEventListener('abort', handleAbort);
        const timeoutMs = commitment === 'processed' ? 30_000 : 60_000;
        const startMs = performance.now();
        const timeoutId =
            // We use `setTimeout` instead of `AbortSignal.timeout()` because we want to measure
            // elapsed time instead of active time.
            // See https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
            setTimeout(() => {
                const elapsedMs = performance.now() - startMs;
                reject(new DOMException(`Timeout elapsed after ${elapsedMs} ms`, 'TimeoutError'));
            }, timeoutMs);
    });
}
