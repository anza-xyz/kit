import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';

import type { GetIdentityApi } from '../getIdentity';

const rpc = null as unknown as Rpc<GetIdentityApi>;

void (async () => {
    {
        const result = await rpc.getIdentity().send();
        result satisfies Readonly<{
            identity: Address;
        }>;
    }
});
