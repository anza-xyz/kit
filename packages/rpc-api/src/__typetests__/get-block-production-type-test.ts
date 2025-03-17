import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';

import type { GetBlockProductionApi } from '../getBlockProduction';

const rpc = null as unknown as Rpc<GetBlockProductionApi>;
const identity = 'Joe11111111111111111111111111111' as Address<'Joe11111111111111111111111111111'>;

void (async () => {
    // [DESCRIBE] getBlockProduction with no identity.
    {
        // Returns leader slot / blocks produced record, by validator.
        const result = await rpc.getBlockProduction().send();
        result.value.byIdentity satisfies Record<Address, [leaderSlots: bigint, blocksProduced: bigint]>;
    }

    // [DESCRIBE] getBlockProduction with an identity.
    {
        // Returns leader slot / blocks produced record, for exactly the validator specified.
        const result = await rpc.getBlockProduction({ identity }).send();
        result.value.byIdentity satisfies Record<typeof identity, [leaderSlots: bigint, blocksProduced: bigint]>;
    }
});
