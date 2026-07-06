import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';
import type { Slot } from '@solana/rpc-types';

import type { GetSlotLeadersApi } from '../getSlotLeaders';

const rpc = null as unknown as Rpc<GetSlotLeadersApi>;
const startSlotInclusive = null as unknown as Slot;
const limit = 1;

void (async () => {
    {
        const result = await rpc.getSlotLeaders(startSlotInclusive, limit).send();
        result satisfies Address[];
    }
});
