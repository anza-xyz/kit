/* eslint-disable react-hooks/rules-of-hooks */

import { ReactiveActionSource } from '@solana/subscribable';

import { RequestResult, useRequest } from '../useRequest';

const slotSource = null as unknown as ReactiveActionSource<{ slot: bigint }>;

// [DESCRIBE] useRequest
{
    // Infers T from the source
    useRequest(slotSource) satisfies RequestResult<{ slot: bigint }>;

    // The source argument accepts null
    useRequest<{ slot: bigint }>(null) satisfies RequestResult<{ slot: bigint }>;

    // Options accept a `perRequestSignal` factory
    useRequest(slotSource, { perRequestSignal: () => AbortSignal.timeout(5_000) });
}
