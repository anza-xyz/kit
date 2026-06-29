import type { Rpc } from '@solana/rpc-spec';

import type { GetEpochScheduleApi } from '../getEpochSchedule';

const rpc = null as unknown as Rpc<GetEpochScheduleApi>;

void (async () => {
    {
        const result = await rpc.getEpochSchedule().send();
        result satisfies Readonly<{
            firstNormalEpoch: bigint;
            firstNormalSlot: bigint;
            leaderScheduleSlotOffset: bigint;
            slotsPerEpoch: bigint;
            warmup: boolean;
        }>;
    }
});
