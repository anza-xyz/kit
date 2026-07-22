import type { Rpc } from '@solana/rpc-spec';
import type { Lamports, Slot } from '@solana/rpc-types';

import type { GetMinimumBalanceForRentExemptionApi } from '../getMinimumBalanceForRentExemption';

const rpc = null as unknown as Rpc<GetMinimumBalanceForRentExemptionApi>;
const size = 0n;

void (async () => {
    {
        const result = await rpc.getMinimumBalanceForRentExemption(size).send();
        result satisfies Lamports;
    }
});
