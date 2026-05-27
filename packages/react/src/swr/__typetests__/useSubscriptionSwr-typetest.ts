/* eslint-disable react-hooks/rules-of-hooks */

import type { ReactiveStreamSource, SolanaRpcResponse } from '@solana/kit';

import { useSubscriptionSwr } from '../useSubscriptionSwr';

const accountSource = null as unknown as ReactiveStreamSource<SolanaRpcResponse<{ lamports: bigint }>>;
const slotSource = null as unknown as ReactiveStreamSource<{ slot: bigint }>;

// [DESCRIBE] useSubscriptionSwr
{
    // Envelope sources surface the envelope unchanged — callers read `data.value` and
    // `data.context.slot` directly.
    const envelope = useSubscriptionSwr(['account'], accountSource);
    envelope.data satisfies SolanaRpcResponse<{ lamports: bigint }> | undefined;
    envelope.data?.value satisfies { lamports: bigint } | undefined;
    envelope.data?.context.slot satisfies bigint | undefined;

    // Raw notifications pass through unchanged.
    const raw = useSubscriptionSwr(['slot'], slotSource);
    raw.data satisfies { slot: bigint } | undefined;

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
