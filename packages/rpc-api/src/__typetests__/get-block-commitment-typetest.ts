import type { Rpc } from '@solana/rpc-spec';
import type { Lamports, Slot } from '@solana/rpc-types';

import type { GetBlockCommitmentApi } from '../getBlockCommitment';

const rpc = null as unknown as Rpc<GetBlockCommitmentApi>;
const slot = null as unknown as Slot;

void (async () => {
    {
        const result = await rpc.getBlockCommitment(slot).send();
        result satisfies Readonly<{
            commitment: readonly Lamports[] | null;
            totalStake: Lamports;
        }>;
    }
});
