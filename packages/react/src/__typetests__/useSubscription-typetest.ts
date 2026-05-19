/* eslint-disable react-hooks/rules-of-hooks */

import { SolanaRpcResponse } from '@solana/rpc-types';
import { ReactiveStreamSource } from '@solana/subscribable';

import { SubscriptionResult, useSubscription } from '../useSubscription';

const accountSource = null as unknown as ReactiveStreamSource<SolanaRpcResponse<{ lamports: bigint }>>;
const slotSource = null as unknown as ReactiveStreamSource<{ slot: bigint }>;

// [DESCRIBE] useSubscription
{
    // Unwraps `SolanaRpcResponse<U>` envelopes so `data` is the inner value
    useSubscription(accountSource) satisfies SubscriptionResult<{ lamports: bigint }>;

    // Raw notifications pass through unchanged
    useSubscription(slotSource) satisfies SubscriptionResult<{ slot: bigint }>;

    // Source argument accepts null
    useSubscription<{ slot: bigint }>(null) satisfies SubscriptionResult<{ slot: bigint }>;

    // Options accept a `getAbortSignal` factory
    useSubscription(slotSource, { getAbortSignal: () => AbortSignal.timeout(30_000) });

    // `reconnect` accepts no args (uses the factory), an `{ abortSignal }` override, or
    // `{ abortSignal: undefined }` to opt out of the factory entirely.
    const { reconnect, status } = useSubscription(slotSource);
    reconnect();
    reconnect({ abortSignal: AbortSignal.timeout(1_000) });
    reconnect({ abortSignal: undefined });
    // @ts-expect-error - abortSignal must be an AbortSignal (or undefined)
    reconnect({ abortSignal: 'nope' });

    // Status is a discriminated string, not a generic string
    status satisfies 'disabled' | 'error' | 'loaded' | 'loading';
    // @ts-expect-error - 'success' is the action-store vocabulary, not stream
    status satisfies 'success';
}
