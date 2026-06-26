import type { Rpc } from '@solana/rpc-spec';
import type { Slot } from '@solana/rpc-types';

import type { GetHighestSnapshotSlotApi } from '../getHighestSnapshotSlot';

const rpc = null as unknown as Rpc<GetHighestSnapshotSlotApi>;

void (async () => {
    {
        const result = await rpc.getHighestSnapshotSlot().send();
        result satisfies Readonly<{
            full: Slot;
            incremental: Slot | null;
        }>;
    }
});
