import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';
import type { Lamports, Slot } from '@solana/rpc-types';

import type { GetInflationRewardApi } from '../getInflationReward';

const rpc = null as unknown as Rpc<GetInflationRewardApi>;
const addresses = null as unknown as readonly Address[];

void (async () => {
    {
        const result = await rpc.getInflationReward(addresses).send();
        result satisfies readonly (Readonly<{
            amount: Lamports;
            commission: number;
            effectiveSlot: Slot;
            epoch: bigint;
            postBalance: Lamports;
        }> | null)[];
    }
});
