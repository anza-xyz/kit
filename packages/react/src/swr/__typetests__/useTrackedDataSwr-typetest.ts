/* eslint-disable react-hooks/rules-of-hooks */

import type { TrackedDataSpec } from '../../useTrackedData';
import type { SlotTaggedValue } from '../useSubscriptionSwr';
import { useTrackedDataSwr } from '../useTrackedDataSwr';

const spec = null as unknown as TrackedDataSpec<{ a: number }, { b: number }, number>;

// [DESCRIBE] useTrackedDataSwr
{
    // `data.value` is the unified item type produced by the spec's mappers.
    const result = useTrackedDataSwr(['balance'], spec);
    result.data satisfies SlotTaggedValue<number> | undefined;

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
