import type { Rpc } from '@solana/rpc-spec';
import type { Slot } from '@solana/rpc-types';

import type { GetEpochInfoApi } from '../getEpochInfo';

const rpc = null as unknown as Rpc<GetEpochInfoApi>;

void (async () => {
    {
        const result = await rpc.getEpochInfo().send();
        result satisfies Readonly<{
            absoluteSlot: Slot;
            blockHeight: bigint;
            epoch: bigint;
            slotIndex: bigint;
            slotsInEpoch: bigint;
            transactionCount: bigint | null;
        }>;
    }
});
