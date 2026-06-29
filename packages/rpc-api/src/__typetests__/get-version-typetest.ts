import type { Rpc } from '@solana/rpc-spec';

import type { GetVersionApi } from '../getVersion';

const rpc = null as unknown as Rpc<GetVersionApi>;

void (async () => {
    {
        const result = await rpc.getVersion().send();
        result satisfies Readonly<{
            'feature-set': number;
            'solana-core': string;
        }>;
    }
});
