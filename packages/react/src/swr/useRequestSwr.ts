import type { ReactiveActionSource } from '@solana/kit';
import { useCallback, useRef } from 'react';
import useSWR, { type Key as SWRKey, type SWRConfiguration, type SWRResponse } from 'swr';

import { useIsomorphicLayoutEffect } from '../useIsomorphicLayoutEffect';
import type { UseRequestOptions } from '../useRequest';

/**
 * SWR-backed counterpart to core's `useRequest`. Accepts the same source shape — a
 * {@link ReactiveActionSource} (satisfied by `PendingRpcRequest<T>`) or a
 * `(signal: AbortSignal) => Promise<T>` function — and routes it through SWR so components
 * reading the same `key` share one in-flight fetch and participate in SWR's revalidation,
 * persistence, and devtools.
 *
 * Pass `null` for `key` or `source` to disable — useful when one of the source's inputs isn't
 * yet known. Include source inputs in `key` to partition the cache. Use `result.mutate()` to
 * re-fire on demand (no Kit-specific `refresh` — SWR owns that).
 *
 * @typeParam T - The value the underlying request resolves to.
 * @typeParam TError - The error type SWR will surface on failure.
 *
 * @example
 * ```tsx
 * function EpochInfo() {
 *     const client = useClient<ClientWithRpc<GetEpochInfoApi>>();
 *     const { data } = useRequestSwr(['epochInfo'], client.rpc.getEpochInfo());
 *     return <p>{data ? `Epoch ${data.epoch}` : 'Loading…'}</p>;
 * }
 *
 * // Per-attempt timeout via `getAbortSignal` (same option as `useRequest`).
 * useRequestSwr(['epochInfo'], source, { getAbortSignal: () => AbortSignal.timeout(5_000) });
 * ```
 */
export function useRequestSwr<T, TError = Error>(
    key: SWRKey,
    source: ReactiveActionSource<T> | ((signal: AbortSignal) => Promise<T>) | null,
    options?: SWRConfiguration<T, TError> & UseRequestOptions,
): SWRResponse<T, TError> {
    // Split our option off the SWR config so we can hand the rest to `useSWR` cleanly.
    const { getAbortSignal, ...swrConfig } = options ?? {};

    // Ref-sync the source and the abort-signal factory so an inline closure passed each render
    // doesn't change the fetcher's identity. The fetcher reads the latest values from the refs
    // when it fires; SWR uses the key (not the fetcher identity) for cache lookup.
    const sourceRef = useRef(source);
    const getAbortSignalRef = useRef(getAbortSignal);
    useIsomorphicLayoutEffect(() => {
        sourceRef.current = source;
        getAbortSignalRef.current = getAbortSignal;
    });

    const fetcher = useCallback(async (): Promise<T> => {
        const userSignal = getAbortSignalRef.current?.();
        const current = sourceRef.current!;
        if (typeof current === 'function') {
            // The source's signature requires an `AbortSignal` — hand it the user's signal if
            // one was configured, otherwise a fresh never-aborted signal so the type fits.
            return await current(userSignal ?? new AbortController().signal);
        }
        if (userSignal) {
            return await current.reactiveStore().withSignal(userSignal).dispatchAsync();
        }
        return await current.reactiveStore().dispatchAsync();
    }, []);

    // Force the key to `null` when there's no source — either-null disables the fetch.
    return useSWR<T, TError>(source == null ? null : key, fetcher, swrConfig);
}
