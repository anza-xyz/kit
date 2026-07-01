import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';

import type { GetClusterNodesApi } from '../getClusterNodes';

const rpc = null as unknown as Rpc<GetClusterNodesApi>;

void (async () => {
    {
        const result = await rpc.getClusterNodes().send();
        result satisfies readonly Readonly<{
            clientId: string | null;
            featureSet: number | null;
            gossip: string | null;
            pubkey: Address;
            pubsub: string | null;
            rpc: string | null;
            serveRepair: string | null;
            shredVersion: number | null;
            tpu: string | null;
            tpuForwards: string | null;
            tpuForwardsQuic: string | null;
            tpuQuic: string | null;
            tpuVote: string | null;
            tvu: string | null;
            version: string | null;
        }>[];
    }
});
