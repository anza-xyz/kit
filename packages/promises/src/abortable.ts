import { safeRace } from './race';

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
