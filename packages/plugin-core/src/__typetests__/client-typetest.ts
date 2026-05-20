/* eslint-disable @typescript-eslint/no-floating-promises */
import {
    type AsyncClient,
    type Client,
    type ClientPlugin,
    createClient,
    extendClient,
    type ExtendedClient,
    withCleanup,
} from '../client';

const EMPTY_CLIENT = null as unknown as Client<object>;
const EMPTY_ASYNC_CLIENT = null as unknown as AsyncClient<object>;

/**
 * Strict type-equality helper used by typetests below. Resolves to `true` only
 * if `A` and `B` are mutually assignable AND share the same modifier set (`?`,
 * `readonly`); otherwise resolves to `false`.
 *
 * This is stricter than `satisfies` for two reasons:
 *
 * 1. **Bidirectionality.** `A satisfies B` only checks that `A` is assignable
 *    to `B`. A test using `satisfies` passes if the actual type has extra
 *    members beyond what we asserted — which would silently mask a regression
 *    that re-introduced a nested `Omit<...>` wrapper, since `Omit<X, K> & A`
 *    is still structurally assignable to a flat literal.
 * 2. **Modifier strictness.** `A satisfies B` tolerates losing `?` (required
 *    is assignable to optional) and losing `readonly` (readonly is assignable
 *    to mutable). `Equal` distinguishes `{ x: T }` from `{ x?: T }` and from
 *    `{ readonly x: T }` because the inferred-position generic comparison
 *    uses identity rather than assignability for the type parameters.
 *
 * Use `Equal` when the exact shape (including modifiers) matters. Use
 * `satisfies` when one-way assignability is the actual requirement (e.g.
 * "this value is usable where `Disposable & X` is expected").
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

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

// [DESCRIBE] createClient
{
    // It returns an empty Client (See typetests above).
    {
        createClient() satisfies typeof EMPTY_CLIENT;
    }

    // It creates a Client from an existing object.
    {
        createClient({ fruit: 'banana' as const }) satisfies Client<{ fruit: 'banana' }>;
    }
}

// [DESCRIBE] extendClient
{
    // It merges both types into the result.
    {
        const result = extendClient({ fruit: 'apple' as const }, { vegetable: 'carrot' as const });
        result satisfies { fruit: 'apple'; vegetable: 'carrot' };
    }

    // It allows the second type to override the first.
    {
        const result = extendClient({ fruit: 'apple' as const }, { fruit: 'banana' as const });
        result satisfies { fruit: 'banana' };
        // @ts-expect-error - fruit is no longer an apple.
        result satisfies { fruit: 'apple' };
    }

    // It rejects non-object clients.
    {
        // @ts-expect-error - client is not an object.
        extendClient(42, {});
    }

    // It rejects non-object additions.
    {
        // @ts-expect-error - additions is not an object.
        extendClient({}, 'hello');
    }

    // It returns an `ExtendedClient` so that chained calls produce a flat object
    // literal (not a nested `Omit<...>` chain) at every step and modifiers are
    // preserved. The detailed shape assertions live in the `ExtendedClient`
    // describe block below; this test only verifies the wiring between
    // `extendClient` and `ExtendedClient`.
    {
        type Result = ReturnType<
            typeof extendClient<{ fruit: 'apple' }, { readonly grain?: 'rice'; vegetable: 'carrot' }>
        >;
        type Expected = ExtendedClient<{ fruit: 'apple' }, { readonly grain?: 'rice'; vegetable: 'carrot' }>;
        true satisfies Equal<Result, Expected>;
    }

    // It produces a flat object type (not a nested Omit<...> chain) when chained.
    // The flat type is exactly the union of all additions, with override semantics
    // applied (the second `vegetable` replaces the first).
    {
        type Step1 = ReturnType<typeof extendClient<{ fruit: 'apple' }, { vegetable: 'carrot' }>>;
        type Step2 = ReturnType<typeof extendClient<Step1, { grain: 'rice' }>>;
        type Step3 = ReturnType<typeof extendClient<Step2, { protein: 'tofu' }>>;
        type Step4 = ReturnType<typeof extendClient<Step3, { dessert: 'pie'; vegetable: 'kale' }>>;
        true satisfies Equal<
            Step4,
            { dessert: 'pie'; fruit: 'apple'; grain: 'rice'; protein: 'tofu'; vegetable: 'kale' }
        >;
    }

    // It preserves symbol-keyed properties.
    {
        const result = extendClient({ fruit: 'apple' as const }, { [Symbol.dispose]: () => {} });
        result satisfies { fruit: 'apple'; [Symbol.dispose]: () => void };
    }

    // It preserves function-valued properties as proper callable signatures.
    {
        const result = extendClient({ fruit: 'apple' as const }, { compute: (n: number): number => n + 1 });
        result satisfies { compute: (n: number) => number; fruit: 'apple' };
    }
}

// [Describe] withCleanup
{
    // It returns a Disposable client
    {
        const client = null as unknown as Client<object>;
        withCleanup(client, () => {}) satisfies Client<object> & Disposable;
    }

    // It accepts an already Disposable client
    {
        const client = null as unknown as Client<object> & Disposable;
        withCleanup(client, () => {}) satisfies Client<object> & Disposable;
    }

    // It accepts an AsyncClient
    {
        const client = null as unknown as AsyncClient<object>;
        withCleanup(client, () => {}) satisfies AsyncClient<object> & Disposable;
    }

    // Its return type is an `ExtendedClient` so the merged shape is flat — symbol
    // keys from `Disposable` (`Symbol.dispose`) are merged alongside the client's
    // data properties without an intervening intersection wrapper.
    {
        type Extended = ExtendedClient<{ fruit: 'apple' }, { vegetable: 'carrot' }>;
        type Result = ReturnType<typeof withCleanup<Extended>>;
        true satisfies Equal<Result, ExtendedClient<Extended, Disposable>>;
    }
}

// [DESCRIBE] ExtendedClient
{
    // It flattens an Omit & T intersection into a single object literal type.
    {
        type Result = ExtendedClient<{ fruit: 'apple' }, { vegetable: 'carrot' }>;
        true satisfies Equal<Result, { fruit: 'apple'; vegetable: 'carrot' }>;
    }

    // It drops keys from the client that are overridden by additions, replacing their type.
    {
        type Result = ExtendedClient<{ fruit: 'apple' }, { fruit: 'banana' }>;
        true satisfies Equal<Result, { fruit: 'banana' }>;
    }

    // It preserves the `?` modifier of additions.
    {
        type Result = ExtendedClient<{ fruit: 'apple' }, { vegetable?: 'carrot' }>;
        true satisfies Equal<Result, { fruit: 'apple'; vegetable?: 'carrot' }>;
    }

    // It preserves the `readonly` modifier of additions.
    {
        type Result = ExtendedClient<{ fruit: 'apple' }, { readonly vegetable: 'carrot' }>;
        true satisfies Equal<Result, { fruit: 'apple'; readonly vegetable: 'carrot' }>;
    }

    // It preserves the `?` modifier of properties that come from the original client.
    {
        type Result = ExtendedClient<{ fruit?: 'apple' }, { vegetable: 'carrot' }>;
        true satisfies Equal<Result, { fruit?: 'apple'; vegetable: 'carrot' }>;
    }

    // It preserves the `readonly` modifier of properties that come from the original client.
    {
        type Result = ExtendedClient<{ readonly fruit: 'apple' }, { vegetable: 'carrot' }>;
        true satisfies Equal<Result, { readonly fruit: 'apple'; vegetable: 'carrot' }>;
    }

    // It handles an empty additions type by returning a flat copy of the client.
    // `NonNullable<unknown>` is the canonical way to express the empty object type
    // (`{}`) without tripping the `@typescript-eslint/no-empty-object-type` lint rule.
    {
        type Result = ExtendedClient<{ fruit: 'apple'; vegetable: 'carrot' }, NonNullable<unknown>>;
        true satisfies Equal<Result, { fruit: 'apple'; vegetable: 'carrot' }>;
    }

    // It handles an empty client type by returning a flat copy of the additions.
    {
        type Result = ExtendedClient<NonNullable<unknown>, { fruit: 'apple' }>;
        true satisfies Equal<Result, { fruit: 'apple' }>;
    }

    // It is structurally equivalent to `Omit<TClient, keyof TAdditions> & TAdditions`.
    // This guards against accidental changes to the override semantics.
    {
        type Result = ExtendedClient<{ fruit: 'apple'; grain: 'rice' }, { fruit: 'banana'; vegetable: 'carrot' }>;
        type Reference = Omit<{ fruit: 'apple'; grain: 'rice' }, 'fruit' | 'vegetable'> & {
            fruit: 'banana';
            vegetable: 'carrot';
        };
        const a = null as unknown as Result;
        const b = null as unknown as Reference;
        a satisfies Reference;
        b satisfies Result;
    }
}
