/* eslint-disable react-hooks/rules-of-hooks */

import type { SolanaRpcResponse } from '@solana/kit';

import type { TrackedDataSpec } from '../../useTrackedData';
import { useTrackedDataSwr } from '../useTrackedDataSwr';

const spec = null as unknown as TrackedDataSpec<{ a: number }, { b: number }, number>;

// [DESCRIBE] useTrackedDataSwr
{
    // `data` is the underlying primitive's guaranteed `SolanaRpcResponse<TItem>` envelope.
    const result = useTrackedDataSwr(['balance'], spec);
    result.data satisfies SolanaRpcResponse<number> | undefined;
    result.data?.value satisfies number | undefined;
    result.data?.context.slot satisfies bigint | undefined;

    // Null key disables.
    useTrackedDataSwr(null, spec);

    // Null spec disables.
    useTrackedDataSwr<{ a: number }, { b: number }, number>(['balance'], null);

    // Options merge SWR's config with Kit's per-attempt signal factory.
    useTrackedDataSwr(['balance'], spec, {
        getAbortSignal: () => AbortSignal.timeout(30_000),
        revalidateOnFocus: false,
    });
}
