/* eslint-disable react-hooks/rules-of-hooks */

import type { SolanaRpcResponse } from '@solana/kit';
import type { ReactiveStreamSource } from '@solana/subscribable';

import { type SlotTaggedValue, useSubscriptionSwr } from '../useSubscriptionSwr';

const accountSource = null as unknown as ReactiveStreamSource<SolanaRpcResponse<{ lamports: bigint }>>;
const slotSource = null as unknown as ReactiveStreamSource<{ slot: bigint }>;

// [DESCRIBE] useSubscriptionSwr
{
    // Envelope notifications: `data.value` is the inner value.
    const envelope = useSubscriptionSwr(['account'], accountSource);
    envelope.data satisfies SlotTaggedValue<{ lamports: bigint }> | undefined;

    // Raw notifications pass through unchanged.
    const raw = useSubscriptionSwr(['slot'], slotSource);
    raw.data satisfies SlotTaggedValue<{ slot: bigint }> | undefined;

    // Null key disables.
    useSubscriptionSwr(null, slotSource);

    // Null source disables.
    useSubscriptionSwr<{ slot: bigint }>(['slot'], null);

    // Options merge SWR's config with Kit's per-attempt signal factory.
    useSubscriptionSwr(['slot'], slotSource, {
        getAbortSignal: () => AbortSignal.timeout(30_000),
        revalidateOnFocus: false,
    });
}
