import { ReactiveActionStore } from '@solana/subscribable';
import { useMemo, useSyncExternalStore } from 'react';

import { RequestResult } from './useRequest';

/**
 * Subscribes to a {@link ReactiveActionStore} and maps its `idle | running | success | error`
 * lifecycle onto the {@link RequestResult} shape consumed by `useRequest`.
 *
 * - `idle` (only reachable via `disabledActionStore`) → `disabled`
 * - `running` with no prior successful value → `loading`
 * - `running` with a prior successful value → `retrying`
 * - `success` → `loaded`
 * - `error` → `error`
 *
 * The action store's built-in stale-while-revalidate carries `state.data` across attempts, so
 * the bridge doesn't need to mirror it.
 *
 * @internal
 */
export function useRequestResult<T>(store: ReactiveActionStore<[], T>, refresh: () => void): RequestResult<T> {
    const state = useSyncExternalStore(store.subscribe, store.getState);
    return useMemo(() => {
        switch (state.status) {
            case 'idle':
                return { data: undefined, error: undefined, isLoading: false, refresh, status: 'disabled' };
            case 'running':
                return state.data !== undefined
                    ? { data: state.data, error: undefined, isLoading: false, refresh, status: 'retrying' }
                    : { data: undefined, error: undefined, isLoading: true, refresh, status: 'loading' };
            case 'success':
                return { data: state.data, error: undefined, isLoading: false, refresh, status: 'loaded' };
            case 'error':
                return { data: state.data, error: state.error, isLoading: false, refresh, status: 'error' };
        }
    }, [state, refresh]);
}
