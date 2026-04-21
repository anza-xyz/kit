import type { ClientWithSubscribeToIdentity, ClientWithSubscribeToPayer, SubscribeToFn } from '../subscribe-to';

// [DESCRIBE] SubscribeToFn.
{
    // It takes a listener and returns an unsubscribe function.
    {
        const subscribe = null as unknown as SubscribeToFn;
        const unsubscribe = subscribe(() => {});
        unsubscribe satisfies () => void;
    }
}

// [DESCRIBE] ClientWithSubscribeToPayer.
{
    // It exposes a readonly `subscribeToPayer` of type `SubscribeToFn`.
    {
        const client = null as unknown as ClientWithSubscribeToPayer;
        client.subscribeToPayer satisfies SubscribeToFn;
    }

    // It can be combined with other interfaces via intersection.
    {
        type CustomClient = ClientWithSubscribeToPayer & { customMethod(): void };
        const client = null as unknown as CustomClient;
        client.subscribeToPayer satisfies SubscribeToFn;
        client.customMethod satisfies () => void;
    }
}

// [DESCRIBE] ClientWithSubscribeToIdentity.
{
    // It exposes a readonly `subscribeToIdentity` of type `SubscribeToFn`.
    {
        const client = null as unknown as ClientWithSubscribeToIdentity;
        client.subscribeToIdentity satisfies SubscribeToFn;
    }

    // It can be combined with other interfaces via intersection.
    {
        type CustomClient = ClientWithSubscribeToIdentity & { customMethod(): void };
        const client = null as unknown as CustomClient;
        client.subscribeToIdentity satisfies SubscribeToFn;
        client.customMethod satisfies () => void;
    }
}
