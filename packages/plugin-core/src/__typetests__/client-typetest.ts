/* eslint-disable @typescript-eslint/no-floating-promises */
import { type AsyncClient, type Client, type ClientPlugin, createEmptyClient } from '../client';

const EMPTY_CLIENT = null as unknown as Client<object>;
const EMPTY_ASYNC_CLIENT = null as unknown as AsyncClient<object>;

// [DESCRIBE] ClientPlugin
{
    // A plugin can be the identity function.
    {
        const plugin = (c: object) => c;
        plugin satisfies ClientPlugin<object, object>;
    }

    // A plugin can extend the input object.
    {
        const plugin = (c: { fruit: 'apple' }) => ({ ...c, vegetable: 'carrot' as const });
        plugin satisfies ClientPlugin<{ fruit: 'apple' }, { fruit: 'apple'; vegetable: 'carrot' }>;
    }

    // A plugin can override the input object.
    {
        const plugin = (c: { fruit: 'apple' }) => ({ ...c, fruit: 'banana' as const });
        plugin satisfies ClientPlugin<{ fruit: 'apple' }, { fruit: 'banana' }>;
        // @ts-expect-error - output fruit is no longer an apple.
        plugin satisfies ClientPlugin<{ fruit: 'apple' }, { fruit: 'apple' }>;
    }

    // A plugin can have requirements on the input object.
    {
        const plugin = <T extends { fruit: 'apple' }>(c: T) => ({ ...c, dessert: 'apple cake' as const });
        plugin satisfies ClientPlugin<{ fruit: 'apple' }, { dessert: 'apple cake'; fruit: 'apple' }>;
    }

    // A plugin may be asynchronous.
    {
        const plugin = (c: { fruit: 'apple' }) => Promise.resolve({ ...c, vegetable: 'carrot' as const });
        plugin satisfies ClientPlugin<{ fruit: 'apple' }, Promise<{ fruit: 'apple'; vegetable: 'carrot' }>>;
    }

    // A plugin must accept an object.
    {
        const plugin = (c: number) => c;
        // @ts-expect-error - input is not an object.
        plugin satisfies ClientPlugin<object, object>;
    }

    // A plugin must return an object.
    {
        const plugin = (c: object): number => Object.getOwnPropertyNames(c).length;
        // @ts-expect-error - output is not an object.
        plugin satisfies ClientPlugin<object, object>;
    }
}

// [DESCRIBE] Client
{
    // It returns a modified Client when using a plugin.
    {
        const client = EMPTY_CLIENT.use(c => ({ ...c, fruit: 'apple' as const }));
        client satisfies Client<{ fruit: 'apple' }>;
    }

    // It returns a new AsyncClient when using an asynchronous plugin.
    {
        const client = EMPTY_CLIENT.use(c => Promise.resolve({ ...c, fruit: 'apple' as const }));
        client satisfies AsyncClient<{ fruit: 'apple' }>;
    }

    // It does not accept plugins with invalid inputs.
    {
        // @ts-expect-error - input is not an object.
        EMPTY_CLIENT.use((value: 42) => ({ value }));
        // @ts-expect-error - input is not an object.
        EMPTY_CLIENT.use((value: 'hello') => ({ value }));
        // @ts-expect-error - input is not an object.
        EMPTY_CLIENT.use((value: true) => ({ value }));
        // @ts-expect-error - input is not an object.
        EMPTY_CLIENT.use((value: null) => ({ value }));
        // @ts-expect-error - input is not an object.
        EMPTY_CLIENT.use((value: undefined) => ({ value }));
    }

    // It does not accept plugins with invalid outputs.
    {
        // @ts-expect-error - output is not an object.
        EMPTY_CLIENT.use(() => 42);
        // @ts-expect-error - output is not an object.
        EMPTY_CLIENT.use(() => 'hello');
        // @ts-expect-error - output is not an object.
        EMPTY_CLIENT.use(() => true);
        // @ts-expect-error - output is not an object.
        EMPTY_CLIENT.use(() => null);
        // @ts-expect-error - output is not an object.
        EMPTY_CLIENT.use(() => undefined);
    }

    // It evolves through multiple plugins.
    {
        const client = EMPTY_CLIENT.use(c => ({ ...c, fruit: 'apple' as const }))
            .use(c => ({ ...c, vegetable: 'carrot' as const }))
            .use(c => ({ ...c, grain: 'rice' as const }));
        client satisfies Client<{ fruit: 'apple'; grain: 'rice'; vegetable: 'carrot' }>;
    }

    // It accepts plugins when input type constraints are satisfied.
    {
        const apple = <T>(p: T) => ({ ...p, fruit: 'apple' as const });
        const appleCake = <T extends { fruit: 'apple' }>(p: T) => ({ ...p, dessert: 'apple cake' as const });
        const client = EMPTY_CLIENT.use(apple).use(appleCake);
        client satisfies Client<{ dessert: 'apple cake'; fruit: 'apple' }>;
    }

    // It rejects plugins when input type constraints are not satisfied.
    {
        const banana = <T>(p: T) => ({ ...p, fruit: 'banana' as const });
        const appleCake = <T extends { fruit: 'apple' }>(p: T) => ({ ...p, dessert: 'apple cake' as const });
        const bananaClient = EMPTY_CLIENT.use(banana);
        // @ts-expect-error - banana does not satisfy apple cake input type.
        bananaClient.use(appleCake);
    }
}

// [DESCRIBE] AsyncClient
{
    // It is a Promise.
    {
        EMPTY_ASYNC_CLIENT satisfies Promise<object>;
        null as unknown as AsyncClient<{ fruit: 'apple' }> satisfies Promise<{ fruit: 'apple' }>;
    }

    // It returns a modified AsyncClient when using a synchronous plugin.
    {
        const client = EMPTY_ASYNC_CLIENT.use(c => ({ ...c, fruit: 'apple' as const }));
        client satisfies AsyncClient<{ fruit: 'apple' }>;
    }

    // It returns a modified AsyncClient when using an asynchronous plugin.
    {
        const client = EMPTY_ASYNC_CLIENT.use(c => Promise.resolve({ ...c, fruit: 'apple' as const }));
        client satisfies AsyncClient<{ fruit: 'apple' }>;
    }

    // It does not accept plugins with invalid inputs.
    {
        // @ts-expect-error - input is not an object.
        EMPTY_ASYNC_CLIENT.use((value: 42) => ({ value }));
        // @ts-expect-error - input is not an object.
        EMPTY_ASYNC_CLIENT.use((value: 'hello') => ({ value }));
        // @ts-expect-error - input is not an object.
        EMPTY_ASYNC_CLIENT.use((value: true) => ({ value }));
        // @ts-expect-error - input is not an object.
        EMPTY_ASYNC_CLIENT.use((value: null) => ({ value }));
        // @ts-expect-error - input is not an object.
        EMPTY_ASYNC_CLIENT.use((value: undefined) => ({ value }));
    }

    // It does not accept plugins with invalid outputs.
    {
        // @ts-expect-error - output is not an object.
        EMPTY_ASYNC_CLIENT.use(() => 42);
        // @ts-expect-error - output is not an object.
        EMPTY_ASYNC_CLIENT.use(() => 'hello');
        // @ts-expect-error - output is not an object.
        EMPTY_ASYNC_CLIENT.use(() => true);
        // @ts-expect-error - output is not an object.
        EMPTY_ASYNC_CLIENT.use(() => null);
        // @ts-expect-error - output is not an object.
        EMPTY_ASYNC_CLIENT.use(() => undefined);
    }

    // It evolves through multiple plugins.
    {
        const client = EMPTY_ASYNC_CLIENT.use(c => ({ ...c, fruit: 'apple' as const }))
            .use(c => Promise.resolve({ ...c, vegetable: 'carrot' as const }))
            .use(c => ({ ...c, grain: 'rice' as const }));
        client satisfies AsyncClient<{ fruit: 'apple'; grain: 'rice'; vegetable: 'carrot' }>;
    }

    // It accepts plugins when input type constraints are satisfied.
    {
        const apple = <T>(p: T) => ({ ...p, fruit: 'apple' as const });
        const appleCake = <T extends { fruit: 'apple' }>(p: T) =>
            Promise.resolve({ ...p, dessert: 'apple cake' as const });
        const client = EMPTY_ASYNC_CLIENT.use(apple).use(appleCake);
        client satisfies AsyncClient<{ dessert: 'apple cake'; fruit: 'apple' }>;
    }

    // It rejects plugins when input type constraints are not satisfied.
    {
        const banana = <T>(p: T) => ({ ...p, fruit: 'banana' as const });
        const appleCake = <T extends { fruit: 'apple' }>(p: T) =>
            Promise.resolve({ ...p, dessert: 'apple cake' as const });
        const bananaClient = EMPTY_ASYNC_CLIENT.use(banana);
        // @ts-expect-error - banana does not satisfy apple cake input type.
        bananaClient.use(appleCake);
    }
}

// [DESCRIBE] createEmptyClient
{
    // It returns an empty Client (See typetests above).
    {
        createEmptyClient() satisfies typeof EMPTY_CLIENT;
    }
}
