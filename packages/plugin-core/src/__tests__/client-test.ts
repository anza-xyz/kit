import '@solana/test-matchers/toBeFrozenObject';

import { createClient, extendClient, withCleanup } from '../client';

describe('createClient', () => {
    it('creates an empty object with a use function', () => {
        const emptyClient = createClient();
        expect(typeof emptyClient).toBe('object');
        const attributes = Object.getOwnPropertyNames(emptyClient);
        expect(attributes).toStrictEqual(['use']);
        expect(typeof emptyClient.use).toBe('function');
    });

    it('creates an client from an existing object', () => {
        const client = createClient({ fruit: 'banana' as const });
        expect(typeof client).toBe('object');
        const attributes = Object.getOwnPropertyNames(client);
        expect(attributes).toStrictEqual(['fruit', 'use']);
        expect(typeof client.use).toBe('function');
        expect(client.fruit).toBe('banana');
    });

    it('evolves when using plugins', () => {
        expect(
            createClient()
                .use(c => ({ ...c, fruit: 'apple' as const }))
                .use(c => ({ ...c, vegetable: 'carrot' as const })),
        ).toStrictEqual({
            fruit: 'apple',
            use: expect.any(Function),
            vegetable: 'carrot',
        });
    });

    it('can be overriden by subsequent plugins', () => {
        expect(
            createClient()
                .use(() => ({ fruit: 'apple' as const }))
                .use(() => ({ vegetable: 'carrot' as const })),
        ).toStrictEqual({
            use: expect.any(Function),
            vegetable: 'carrot',
        });
    });

    it('allows plugins to enforce input type constraints', () => {
        expect(
            createClient()
                .use(c => ({ ...c, fruit: 'apple' as const }))
                .use(<T extends { fruit: 'apple' }>(c: T) => ({ ...c, dessert: 'apple cake' as const })),
        ).toStrictEqual({
            dessert: 'apple cake',
            fruit: 'apple',
            use: expect.any(Function),
        });
    });

    it('preserves getter properties from plugins', () => {
        const client = createClient()
            // Make fruit a get() property
            .use(c => {
                const result = { ...c };
                Object.defineProperty(result, 'fruit', { configurable: true, enumerable: true, get: () => 'apple' });
                return result;
            })
            // Make dessert a normal property
            .use(c => {
                // Use Object.defineProperties to preserve the getter on fruit
                const result: typeof c = Object.defineProperties({}, Object.getOwnPropertyDescriptors(c));
                Object.defineProperty(result, 'dessert', { configurable: true, enumerable: true, value: 'apple cake' });
                return result;
            });
        expect(Object.getOwnPropertyDescriptor(client, 'fruit')?.get).toBeInstanceOf(Function);
        expect((client as unknown as { fruit: string }).fruit).toBe('apple');
        expect((client as unknown as { dessert: string }).dessert).toBe('apple cake');
    });

    it('preserves symbol-keyed properties from plugins', () => {
        const sym = Symbol('fruit');

        const client = createClient()
            // Add the fruit symbol property
            .use(c => ({ ...c, [sym]: 'apple' }))
            // Add dessert as a normal property
            .use(c => {
                // Use Object.defineProperties to preserve the symbol on fruit
                const result = Object.defineProperties({}, Object.getOwnPropertyDescriptors(c)) as typeof c;
                Object.defineProperty(result, 'dessert', { configurable: true, enumerable: true, value: 'apple cake' });
                return result;
            });
        expect((client as Record<symbol, unknown>)[sym]).toBe('apple');
        expect((client as unknown as { dessert: string }).dessert).toBe('apple cake');
    });

    it('supports asynchronous plugins', async () => {
        expect.assertions(1);
        await expect(
            createClient()
                .use(c => Promise.resolve({ ...c, fruit: 'apple' as const }))
                .use(c => Promise.resolve({ ...c, vegetable: 'carrot' as const })),
        ).resolves.toStrictEqual({
            fruit: 'apple',
            use: expect.any(Function),
            vegetable: 'carrot',
        });
    });

    it('supports a mixture of synchronous and asynchronous plugins', async () => {
        expect.assertions(1);
        await expect(
            createClient()
                .use(c => ({ ...c, fruit: 'apple' as const }))
                .use(c => Promise.resolve({ ...c, vegetable: 'carrot' as const }))
                .use(c => ({ ...c, grain: 'rice' as const }))
                .use(c => Promise.resolve({ ...c, protein: 'beans' as const })),
        ).resolves.toStrictEqual({
            fruit: 'apple',
            grain: 'rice',
            protein: 'beans',
            use: expect.any(Function),
            vegetable: 'carrot',
        });
    });

    it('can catch synchronous errors', () => {
        expect(() =>
            createClient().use(() => {
                throw new Error('Missing fruit');
            }),
        ).toThrow('Missing fruit');
    });

    it('can catch asynchronous errors', async () => {
        expect.assertions(1);
        await expect(
            createClient().use(() => {
                return Promise.reject(new Error('Missing fruit'));
            }),
        ).rejects.toThrow('Missing fruit');
    });

    it('can chain the then function on the async client', async () => {
        expect.assertions(1);
        const thenFn = jest.fn();
        await createClient()
            .use(() => Promise.resolve({ fruit: 'apple' as const }))
            .then(thenFn);
        expect(thenFn).toHaveBeenNthCalledWith(1, expect.objectContaining({ fruit: 'apple' }));
    });

    it('can chain the catch function on the async client', async () => {
        expect.assertions(1);
        const catchFn = jest.fn();
        await createClient()
            .use(() => Promise.reject(new Error('Missing fruit')))
            .catch(catchFn);
        expect(catchFn).toHaveBeenNthCalledWith(1, expect.objectContaining({ message: 'Missing fruit' }));
    });

    it('can chain the finally function on the async client when successful', async () => {
        expect.assertions(1);
        const finallyFn = jest.fn();
        await createClient()
            .use(() => Promise.resolve({ fruit: 'apple' as const }))
            .finally(finallyFn);
        expect(finallyFn).toHaveBeenCalledTimes(1);
    });

    it('can chain the finally function on the async client when unsuccessful', async () => {
        expect.assertions(1);
        const finallyFn = jest.fn();
        await createClient()
            .use(() => Promise.reject(new Error('Missing fruit')))
            .finally(finallyFn)
            .catch(() => {});
        expect(finallyFn).toHaveBeenCalledTimes(1);
    });

    it('does not resolve subsequent asynchronous plugins after an error', async () => {
        expect.assertions(1);
        const subsequentPlugin = jest.fn();
        await createClient()
            .use(() => Promise.reject(new Error('Missing fruit')))
            .use(subsequentPlugin)
            .catch(() => {});
        expect(subsequentPlugin).not.toHaveBeenCalled();
    });

    it('allows plugins to use createClient internally to offer plugin bundles', () => {
        const fruitPlugin = <T extends object>(c: T) => ({ ...c, fruit: 'apple' as const });
        const vegetablePlugin = <T extends object>(c: T) => ({ ...c, vegetable: 'carrot' as const });
        const proteinPlugin = <T extends object>(c: T) => ({ ...c, protein: 'tofu' as const });
        const foodPlugin = <T extends object>(c: T) =>
            createClient(c).use(fruitPlugin).use(vegetablePlugin).use(proteinPlugin);

        expect(createClient().use(foodPlugin)).toStrictEqual({
            fruit: 'apple',
            protein: 'tofu',
            use: expect.any(Function),
            vegetable: 'carrot',
        });
    });

    it('returns a frozen object when empty', () => {
        expect(createClient()).toBeFrozenObject();
    });

    it('returns a frozen object when extended by a plugin', () => {
        expect(createClient().use(() => ({ fruit: 'apple' as const }))).toBeFrozenObject();
    });

    it('returns a frozen object when extended by an asynchronous plugin', () => {
        expect(createClient().use(() => Promise.resolve({ fruit: 'apple' as const }))).toBeFrozenObject();
    });
});

describe('extendClient', () => {
    it('merges client and additions into a new object', () => {
        expect(extendClient({ fruit: 'apple' as const }, { vegetable: 'carrot' as const })).toStrictEqual({
            fruit: 'apple',
            vegetable: 'carrot',
        });
    });

    it('additions override client on key conflict', () => {
        expect(extendClient({ fruit: 'apple' as const }, { fruit: 'banana' as const })).toStrictEqual({
            fruit: 'banana',
        });
    });

    it('client properties not present in additions are preserved', () => {
        expect(
            extendClient({ fruit: 'apple' as const, vegetable: 'carrot' as const }, { fruit: 'banana' as const }),
        ).toStrictEqual(expect.objectContaining({ fruit: 'banana', vegetable: 'carrot' }));
    });

    it('preserves getter from client', () => {
        const client = Object.defineProperty({} as { fruit: string }, 'fruit', {
            configurable: true,
            enumerable: true,
            get: () => 'apple',
        });
        const result = extendClient(client, { vegetable: 'carrot' as const });
        expect(Object.getOwnPropertyDescriptor(result, 'fruit')?.get).toBeInstanceOf(Function);
        expect(result.fruit).toBe('apple');
    });

    it('preserves getter from additions', () => {
        const additions = Object.defineProperty({} as { vegetable: string }, 'vegetable', {
            configurable: true,
            enumerable: true,
            get: () => 'carrot',
        });
        const result = extendClient({ fruit: 'apple' as const }, additions);
        expect(Object.getOwnPropertyDescriptor(result, 'vegetable')?.get).toBeInstanceOf(Function);
        expect(result.vegetable).toBe('carrot');
    });

    it('preserves symbol-keyed property from client', () => {
        const sym = Symbol('tag');
        const result = extendClient({ [sym]: 'apple' }, { vegetable: 'carrot' as const });
        expect((result as Record<symbol, unknown>)[sym]).toBe('apple');
        expect(result.vegetable).toBe('carrot');
    });

    it('includes symbol-keyed property from additions', () => {
        const sym = Symbol('tag');
        const result = extendClient({ fruit: 'apple' as const }, { [sym]: 'carrot' });
        expect((result as Record<symbol, unknown>)[sym]).toBe('carrot');
    });

    it('preserves non-enumerable property from client', () => {
        const client = Object.defineProperty({}, 'secret', {
            configurable: true,
            enumerable: false,
            value: 'hidden',
            writable: true,
        });
        const result = extendClient(client, { vegetable: 'carrot' as const });
        expect(Object.getOwnPropertyDescriptor(result, 'secret')?.enumerable).toBe(false);
        expect((result as Record<string, unknown>)['secret']).toBe('hidden');
    });

    it('returns a frozen object', () => {
        expect(extendClient({ fruit: 'apple' as const }, { vegetable: 'carrot' as const })).toBeFrozenObject();
    });
});

describe('withCleanup', () => {
    it('calls the cleanup function when disposed', () => {
        const cleanup = jest.fn();
        const result = withCleanup({}, cleanup);
        result[Symbol.dispose]();
        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('disposes using the `using` syntax', () => {
        const cleanup = jest.fn();
        {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            using _ = withCleanup({}, cleanup);
        }
        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('does not call the cleanup function before dispose is invoked', () => {
        const cleanup = jest.fn();
        withCleanup({}, cleanup);
        expect(cleanup).not.toHaveBeenCalled();
    });

    it('chains parent Symbol.dispose when client already has one', () => {
        const callOrder: string[] = [];
        const parentDispose = jest.fn(() => callOrder.push('parent'));
        const cleanup = jest.fn(() => callOrder.push('cleanup'));
        const client = { [Symbol.dispose]: parentDispose };
        const result = withCleanup(client, cleanup);
        result[Symbol.dispose]();
        expect(cleanup).toHaveBeenCalledTimes(1);
        expect(parentDispose).toHaveBeenCalledTimes(1);
        expect(callOrder).toStrictEqual(['cleanup', 'parent']);
    });

    it('does not throw when client has no Symbol.dispose', () => {
        const cleanup = jest.fn();
        const result = withCleanup({}, cleanup);
        expect(() => result[Symbol.dispose]()).not.toThrow();
    });

    it('preserves existing client properties', () => {
        const result = withCleanup({ fruit: 'apple' as const }, () => {});
        expect(result.fruit).toBe('apple');
    });

    it('symbol.dispose is a function on the result', () => {
        const result = withCleanup({}, () => {});
        expect(typeof result[Symbol.dispose]).toBe('function');
    });

    it('returns a frozen object', () => {
        expect(withCleanup({ fruit: 'apple' as const }, () => {})).toBeFrozenObject();
    });

    it('calls all cleanup functions when withCleanup is called multiple times', () => {
        const cleanup1 = jest.fn();
        const cleanup2 = jest.fn();
        const client = withCleanup({}, cleanup1);
        const result = withCleanup(client, cleanup2);
        result[Symbol.dispose]();
        expect(cleanup1).toHaveBeenCalledTimes(1);
        expect(cleanup2).toHaveBeenCalledTimes(1);
    });

    it('calls multiple cleanups in LIFO order', () => {
        const callOrder: string[] = [];
        const cleanup1 = jest.fn(() => callOrder.push('cleanup1'));
        const cleanup2 = jest.fn(() => callOrder.push('cleanup2'));
        const client = withCleanup({}, cleanup1);
        const result = withCleanup(client, cleanup2);
        result[Symbol.dispose]();
        expect(callOrder).toStrictEqual(['cleanup2', 'cleanup1']);
    });

    it('calls multiple cleanups and existing parent dispose in the correct order', () => {
        const callOrder: string[] = [];
        const parentDispose = jest.fn(() => callOrder.push('parent'));
        const cleanup1 = jest.fn(() => callOrder.push('cleanup1'));
        const cleanup2 = jest.fn(() => callOrder.push('cleanup2'));
        const client = withCleanup({ [Symbol.dispose]: parentDispose }, cleanup1);
        const result = withCleanup(client, cleanup2);
        result[Symbol.dispose]();
        expect(callOrder).toStrictEqual(['cleanup2', 'cleanup1', 'parent']);
    });
});
