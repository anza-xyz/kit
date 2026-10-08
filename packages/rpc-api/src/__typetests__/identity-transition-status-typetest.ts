import type { Address } from '@solana/addresses';
import type { Rpc } from '@solana/rpc-spec';
import type { Slot } from '@solana/rpc-types';

import type {
    IdentityTransitionStatusApi,
    IdentityTransitionStatusApiResponse,
    SolanaRpcApi,
    SolanaRpcApiDevnet,
    SolanaRpcApiMainnet,
    SolanaRpcApiTestnet,
} from '..';

const rpc = null as unknown as Rpc<IdentityTransitionStatusApi>;

'identityTransitionStatus' satisfies keyof SolanaRpcApi;
'identityTransitionStatus' satisfies keyof SolanaRpcApiDevnet;
'identityTransitionStatus' satisfies keyof SolanaRpcApiMainnet;
'identityTransitionStatus' satisfies keyof SolanaRpcApiTestnet;

void (async () => {
    const result = await rpc.identityTransitionStatus().send();
    result satisfies IdentityTransitionStatusApiResponse;
    result satisfies Readonly<{
        consensus: 'alpenglow' | 'tower' | 'unknown';
        currentIdentity: Address;
        error: string | null;
        fromIdentity: Address;
        fromIdentityLastSubmittedVoteSlot: Slot | null;
        processInstanceId: string;
        sequence: bigint;
        state: 'complete' | 'failed' | 'idle' | 'transitioning';
        toIdentity: Address;
        towerRootSlot: Slot | null;
        version: bigint;
        voteAccount: Address | '';
    }>;
    // @ts-expect-error The method does not accept commitment or other arguments.
    rpc.identityTransitionStatus({ commitment: 'finalized' });
    // @ts-expect-error The response snapshot is readonly.
    result.state = 'complete';
    // @ts-expect-error Slots can be null and are bigint rather than number.
    result.fromIdentityLastSubmittedVoteSlot satisfies number;
});
