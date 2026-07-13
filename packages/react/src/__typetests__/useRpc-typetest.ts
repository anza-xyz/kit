/* eslint-disable react-hooks/rules-of-hooks */

import type { Rpc, SolanaRpcApi, SolanaRpcApiMainnet } from '@solana/kit';

import { useRpc } from '../useRpc';

// [DESCRIBE] useRpc
{
    // It defaults to Rpc<SolanaRpcApi>
    {
        const rpc = useRpc();
        rpc satisfies Rpc<SolanaRpcApi>;
        void rpc.getBalance;
    }

    // It narrows to a custom method set
    {
        const rpc = useRpc<SolanaRpcApiMainnet>();
        rpc satisfies Rpc<SolanaRpcApiMainnet>;
    }

    // A method absent from the narrowed API is rejected (requestAirdrop is not on Mainnet)
    {
        const rpc = useRpc<SolanaRpcApiMainnet>();
        // @ts-expect-error - requestAirdrop is not part of SolanaRpcApiMainnet
        void rpc.requestAirdrop;
    }
}
