import type { Rpc } from '@solana/rpc-spec';
import type { F64UnsafeSeeDocumentation } from '@solana/rpc-types';

import type { GetInflationRateApi } from '../getInflationRate';

const rpc = null as unknown as Rpc<GetInflationRateApi>;

void (async () => {
    {
        const result = await rpc.getInflationRate().send();
        result satisfies Readonly<{
            epoch: bigint;
            foundation: F64UnsafeSeeDocumentation;
            total: F64UnsafeSeeDocumentation;
            validator: F64UnsafeSeeDocumentation;
        }>;
    }
});
