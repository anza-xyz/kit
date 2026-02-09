import type { Rpc } from '@solana/rpc-spec';
import type { RpcSubscriptions } from '@solana/rpc-subscriptions-spec';

import type { ClientWithRpc, ClientWithRpcSubscriptions } from '../rpc';

type TestRpcMethods = {
    getBalance(address: string): bigint;
    getSlot(): number;
};

type TestSubscriptionMethods = {
    accountNotifications(address: string): { lamports: bigint };
    slotNotifications(): number;
};

// [DESCRIBE] ClientWithRpc.
{
    // It provides an rpc property typed with the given RPC methods.
    {
        const client = null as unknown as ClientWithRpc<TestRpcMethods>;
        client.rpc satisfies Rpc<TestRpcMethods>;
    }

    // It can be combined with other interfaces via intersection.
    {
        type CombinedClient = ClientWithRpc<TestRpcMethods> & { payer: { address: string } };
        const client = null as unknown as CombinedClient;
        client.rpc satisfies Rpc<TestRpcMethods>;
        client.payer.address satisfies string;
    }
}

// [DESCRIBE] ClientWithRpcSubscriptions.
{
    // It provides an rpcSubscriptions property typed with the given subscription methods.
    {
        const client = null as unknown as ClientWithRpcSubscriptions<TestSubscriptionMethods>;
        client.rpcSubscriptions satisfies RpcSubscriptions<TestSubscriptionMethods>;
    }

    // It can be combined with ClientWithRpc.
    {
        type FullRpcClient = ClientWithRpc<TestRpcMethods> & ClientWithRpcSubscriptions<TestSubscriptionMethods>;
        const client = null as unknown as FullRpcClient;
        client.rpc satisfies Rpc<TestRpcMethods>;
        client.rpcSubscriptions satisfies RpcSubscriptions<TestSubscriptionMethods>;
    }
}
