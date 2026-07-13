/* eslint-disable react-hooks/rules-of-hooks */

import type { RpcSubscriptions, SolanaRpcSubscriptionsApi } from '@solana/kit';

import { useRpcSubscriptions } from '../useRpcSubscriptions';

type SlotOnlySubscriptions = Pick<SolanaRpcSubscriptionsApi, 'slotNotifications'>;

// [DESCRIBE] useRpcSubscriptions
{
    // It defaults to RpcSubscriptions<SolanaRpcSubscriptionsApi>
    {
        const rpcSubscriptions = useRpcSubscriptions();
        rpcSubscriptions satisfies RpcSubscriptions<SolanaRpcSubscriptionsApi>;
        void rpcSubscriptions.accountNotifications;
    }

    // It narrows to a custom subscription method set
    {
        const rpcSubscriptions = useRpcSubscriptions<SlotOnlySubscriptions>();
        rpcSubscriptions satisfies RpcSubscriptions<SlotOnlySubscriptions>;
        void rpcSubscriptions.slotNotifications;
    }

    // A method absent from the narrowed API is rejected
    {
        const rpcSubscriptions = useRpcSubscriptions<SlotOnlySubscriptions>();
        // @ts-expect-error - accountNotifications is not part of SlotOnlySubscriptions
        void rpcSubscriptions.accountNotifications;
    }
}
