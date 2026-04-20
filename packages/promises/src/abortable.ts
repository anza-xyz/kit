import { safeRace } from './race';

/**
 * Returns `true` if the given value is an `Error` whose `name` is `'AbortError'`.
 *
 * When an {@link AbortSignal} fires without a custom `reason`, or when APIs like `fetch` are
 * aborted, they reject with a `DOMException` (or similar `Error` subclass) whose `name` is
 * `'AbortError'`. This helper lets callers distinguish abort rejections from other failures
 * without having to `instanceof`-check every platform-specific error class.
 *
 * @example
 * ```ts
 * try {
 *     await getAbortablePromise(doWork(), signal);
 * } catch (e) {
 *     if (isAbortError(e)) {
 *         // The operation was aborted; don't surface as an error.
 *         return;
 *     }
 *     throw e;
 * }
 * ```
 *
 * @see {@link getAbortablePromise}
 */
export function isAbortError(err: unknown): err is Error {
    return err instanceof Error && err.name === 'AbortError';
}

/**
 * Returns a new promise that will reject if the abort signal fires before the original promise
 * settles. Resolves or rejects with the value of the original promise otherwise.
 *
 * @example
 * ```ts
 * const result = await getAbortablePromise(
 *     // Resolves or rejects when `fetch` settles.
 *     fetch('https://example.com/json').then(r => r.json()),
 *     // ...unless it takes longer than 5 seconds, after which the `AbortSignal` is triggered.
 *     AbortSignal.timeout(5000),
 * );
 * ```
 */
export function getAbortablePromise<T>(promise: Promise<T>, abortSignal?: AbortSignal): Promise<T> {
    if (!abortSignal) {
        return promise;
    } else {
        return safeRace([
            // This promise only ever rejects if the signal is aborted. Otherwise it idles forever.
            // It's important that this come before the input promise; in the event of an abort, we
            // want to throw even if the input promise's result is ready
            new Promise<never>((_, reject) => {
                if (abortSignal.aborted) {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(abortSignal.reason);
                } else {
                    abortSignal.addEventListener('abort', function () {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject(this.reason);
                    });
                }
            }),
            promise,
        ]);
    }
}
