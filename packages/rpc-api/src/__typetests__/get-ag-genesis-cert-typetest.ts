import type { Rpc } from '@solana/rpc-spec';
import type { Slot } from '@solana/rpc-types';

import type { GetAgGenesisCertApi } from '../getAgGenesisCert';

const rpc = null as unknown as Rpc<GetAgGenesisCertApi>;

void (async () => {
    {
        const result = await rpc.getAgGenesisCert().send();
        result satisfies Readonly<{
            block: Readonly<{
                blockId: readonly number[];
                slot: Slot;
            }>;
            signature: Readonly<{
                bitmap: readonly number[];
                signature: readonly number[];
            }>;
        }> | null;
    }
});
