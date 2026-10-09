import type { Rpc } from '@solana/rpc-spec';
import type { RpcSubscriptions } from '@solana/rpc-subscriptions-spec';

import {
    assertIsClientWithRpc,
    assertIsClientWithRpcSubscriptions,
    type ClientWithRpc,
    type ClientWithRpcSubscriptions,
    isClientWithRpc,
    isClientWithRpcSubscriptions,
} from '../rpc';

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

// [DESCRIBE] isClientWithRpc.
{
    // It narrows the client to a ClientWithRpc using the provided RPC methods.
    {
        const client = null as unknown as { customMethod(): void };
        if (isClientWithRpc<TestRpcMethods>(client)) {
            client.rpc satisfies Rpc<TestRpcMethods>;
            client.customMethod satisfies () => void;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { customMethod(): void };
        if (!isClientWithRpc<TestRpcMethods>(client)) {
            // @ts-expect-error The client is not known to have an rpc.
            client.rpc satisfies Rpc<TestRpcMethods>;
        }
    }
}

// [DESCRIBE] assertIsClientWithRpc.
{
    // It narrows the client to a ClientWithRpc using the provided RPC methods.
    {
        const client = null as unknown as { customMethod(): void };
        assertIsClientWithRpc<TestRpcMethods>(client);
        client.rpc satisfies Rpc<TestRpcMethods>;
        client.customMethod satisfies () => void;
    }
}

// [DESCRIBE] isClientWithRpcSubscriptions.
{
    // It narrows the client to a ClientWithRpcSubscriptions using the provided subscription methods.
    {
        const client = null as unknown as { customMethod(): void };
        if (isClientWithRpcSubscriptions<TestSubscriptionMethods>(client)) {
            client.rpcSubscriptions satisfies RpcSubscriptions<TestSubscriptionMethods>;
            client.customMethod satisfies () => void;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { customMethod(): void };
        if (!isClientWithRpcSubscriptions<TestSubscriptionMethods>(client)) {
            // @ts-expect-error The client is not known to have rpc subscriptions.
            client.rpcSubscriptions satisfies RpcSubscriptions<TestSubscriptionMethods>;
        }
    }
}

// [DESCRIBE] assertIsClientWithRpcSubscriptions.
{
    // It narrows the client to a ClientWithRpcSubscriptions using the provided subscription methods.
    {
        const client = null as unknown as { customMethod(): void };
        assertIsClientWithRpcSubscriptions<TestSubscriptionMethods>(client);
        client.rpcSubscriptions satisfies RpcSubscriptions<TestSubscriptionMethods>;
        client.customMethod satisfies () => void;
    }
}
