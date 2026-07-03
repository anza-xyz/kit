import type { Rpc } from '@solana/rpc-spec';
import type { Slot, UnixTimestamp } from '@solana/rpc-types';

import type { GetBlockTimeApi } from '../getBlockTime';

const rpc = null as unknown as Rpc<GetBlockTimeApi>;
const blockNumber = null as unknown as Slot;

void (async () => {
    {
        const result = await rpc.getBlockTime(blockNumber).send();
        result satisfies UnixTimestamp;
    }
});
