/* eslint-disable react-hooks/rules-of-hooks */

import type { ReactiveActionSource } from '@solana/kit';
import type { SWRResponse } from 'swr';

import { useRequestSwr } from '../useRequestSwr';

const fnSource = null as unknown as (signal: AbortSignal) => Promise<{ slot: bigint }>;
const reactiveSource = null as unknown as ReactiveActionSource<{ slot: bigint }>;

// [DESCRIBE] useRequestSwr
{
    // Function source — returns SWRResponse with the resolved type.
    useRequestSwr(['epochInfo'], fnSource) satisfies SWRResponse<{ slot: bigint }>;

    // ReactiveActionSource — returns SWRResponse with the source's value type.
    useRequestSwr(['balance'], reactiveSource) satisfies SWRResponse<{ slot: bigint }>;

    // `data` is `T | undefined` until the first successful fetch.
    const { data } = useRequestSwr(['epochInfo'], fnSource);
    data satisfies { slot: bigint } | undefined;

    // Null key is accepted (disables the fetch).
    useRequestSwr(null, fnSource) satisfies SWRResponse<{ slot: bigint }>;

    // Null source is accepted (also disables the fetch).
    useRequestSwr<{ slot: bigint }>(['epochInfo'], null) satisfies SWRResponse<{ slot: bigint }>;

    // Default `TError` is `Error`.
    const { error } = useRequestSwr(['epochInfo'], fnSource);
    error satisfies Error | undefined;

    // `TError` is overridable via the generic.
    useRequestSwr<{ slot: bigint }, string>(['epochInfo'], fnSource).error satisfies string | undefined;

    // Options are forwarded to SWR's configuration.
    useRequestSwr(['epochInfo'], fnSource, {
        // @ts-expect-error - SWR doesn't accept arbitrary keys.
        notARealOption: true,
        revalidateOnFocus: false,
    });

    // Kit-specific options merge into the SWR options bag.
    useRequestSwr(['epochInfo'], fnSource, {
        getAbortSignal: () => AbortSignal.timeout(5_000),
        revalidateOnFocus: false,
    });

    // `getAbortSignal` must return an AbortSignal (or undefined when omitted).
    useRequestSwr(['epochInfo'], fnSource, {
        // @ts-expect-error - factory must return AbortSignal.
        getAbortSignal: () => 'not a signal',
    });

    // Function source must return `Promise<T>` and accept an AbortSignal.
    useRequestSwr(['epochInfo'], (signal: AbortSignal) => {
        signal satisfies AbortSignal;
        return Promise.resolve({ slot: 1n });
    });
}
