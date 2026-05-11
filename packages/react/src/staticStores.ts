import { ReactiveActionStore } from '@solana/subscribable';

const DISABLED_ACTION_STATE = Object.freeze({
    data: undefined,
    error: undefined,
    status: 'idle' as const,
});

const noopUnsubscribe = () => {};
const noopSubscribe = () => noopUnsubscribe;
const rejectedAbortError = (): Promise<never> => Promise.reject(new DOMException('Aborted', 'AbortError'));

/**
 * A {@link ReactiveActionStore} that never transitions out of `idle` and rejects any attempt to
 * dispatch. Returned by `useRequest` (and other action-store hooks) when their factory function
 * returns `null`, signalling that the call should be gated off — for example because a required
 * input (an address, a query string) is not yet known.
 *
 * The hook's result bridge maps this store's `idle` state to a `disabled` status so call sites
 * can distinguish "not enabled" from "loading" without an extra flag.
 */
export function disabledActionStore<T>(): ReactiveActionStore<[], T> {
    return {
        dispatch: noopUnsubscribe,
        dispatchAsync: rejectedAbortError,
        getState: () => DISABLED_ACTION_STATE,
        reset: noopUnsubscribe,
        subscribe: noopSubscribe,
    };
}
