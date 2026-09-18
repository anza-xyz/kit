import {
    assertIsClientWithSubscribeToIdentity,
    assertIsClientWithSubscribeToPayer,
    type ClientWithSubscribeToIdentity,
    type ClientWithSubscribeToPayer,
    isClientWithSubscribeToIdentity,
    isClientWithSubscribeToPayer,
    type SubscribeToFn,
} from '../subscribe-to';

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

// [DESCRIBE] isClientWithSubscribeToPayer.
{
    // It narrows the client to a ClientWithSubscribeToPayer whilst keeping its other properties.
    {
        const client = null as unknown as { customMethod(): void };
        if (isClientWithSubscribeToPayer(client)) {
            client.subscribeToPayer satisfies SubscribeToFn;
            client.customMethod satisfies () => void;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { customMethod(): void };
        if (!isClientWithSubscribeToPayer(client)) {
            // @ts-expect-error The client is not known to have a subscribeToPayer function.
            client.subscribeToPayer satisfies SubscribeToFn;
        }
    }
}

// [DESCRIBE] assertIsClientWithSubscribeToPayer.
{
    // It narrows the client to a ClientWithSubscribeToPayer whilst keeping its other properties.
    {
        const client = null as unknown as { customMethod(): void };
        assertIsClientWithSubscribeToPayer(client);
        client.subscribeToPayer satisfies SubscribeToFn;
        client.customMethod satisfies () => void;
    }
}

// [DESCRIBE] isClientWithSubscribeToIdentity.
{
    // It narrows the client to a ClientWithSubscribeToIdentity whilst keeping its other properties.
    {
        const client = null as unknown as { customMethod(): void };
        if (isClientWithSubscribeToIdentity(client)) {
            client.subscribeToIdentity satisfies SubscribeToFn;
            client.customMethod satisfies () => void;
        }
    }

    // It does not narrow the client when the check fails.
    {
        const client = null as unknown as { customMethod(): void };
        if (!isClientWithSubscribeToIdentity(client)) {
            // @ts-expect-error The client is not known to have a subscribeToIdentity function.
            client.subscribeToIdentity satisfies SubscribeToFn;
        }
    }
}

// [DESCRIBE] assertIsClientWithSubscribeToIdentity.
{
    // It narrows the client to a ClientWithSubscribeToIdentity whilst keeping its other properties.
    {
        const client = null as unknown as { customMethod(): void };
        assertIsClientWithSubscribeToIdentity(client);
        client.subscribeToIdentity satisfies SubscribeToFn;
        client.customMethod satisfies () => void;
    }
}
