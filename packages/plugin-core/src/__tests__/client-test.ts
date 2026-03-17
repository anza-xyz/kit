import '@solana/test-matchers/toBeFrozenObject';

import { createEmptyClient, extendClient } from '../client';

describe('createEmptyClient', () => {
    it('creates an empty object with a use function', () => {
        const emptyClient = createEmptyClient();
        expect(typeof emptyClient).toBe('object');
        const attributes = Object.getOwnPropertyNames(emptyClient);
        expect(attributes).toStrictEqual(['use']);
        expect(typeof emptyClient.use).toBe('function');
    });

    it('evolves when using plugins', () => {
        expect(
            createEmptyClient()
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
            createEmptyClient()
                .use(() => ({ fruit: 'apple' as const }))
                .use(() => ({ vegetable: 'carrot' as const })),
        ).toStrictEqual({
            use: expect.any(Function),
            vegetable: 'carrot',
        });
    });

    it('allows plugins to enforce input type constraints', () => {
        expect(
            createEmptyClient()
                .use(c => ({ ...c, fruit: 'apple' as const }))
                .use(<T extends { fruit: 'apple' }>(c: T) => ({ ...c, dessert: 'apple cake' as const })),
        ).toStrictEqual({
            dessert: 'apple cake',
            fruit: 'apple',
            use: expect.any(Function),
        });
    });

    it('preserves getter properties from plugins', () => {
        const client = createEmptyClient()
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

        const client = createEmptyClient()
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
            createEmptyClient()
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
            createEmptyClient()
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
            createEmptyClient().use(() => {
                throw new Error('Missing fruit');
            }),
        ).toThrow('Missing fruit');
    });

    it('can catch asynchronous errors', async () => {
        expect.assertions(1);
        await expect(
            createEmptyClient().use(() => {
                return Promise.reject(new Error('Missing fruit'));
            }),
        ).rejects.toThrow('Missing fruit');
    });

    it('can chain the then function on the async client', async () => {
        expect.assertions(1);
        const thenFn = jest.fn();
        await createEmptyClient()
            .use(() => Promise.resolve({ fruit: 'apple' as const }))
            .then(thenFn);
        expect(thenFn).toHaveBeenNthCalledWith(1, expect.objectContaining({ fruit: 'apple' }));
    });

    it('can chain the catch function on the async client', async () => {
        expect.assertions(1);
        const catchFn = jest.fn();
        await createEmptyClient()
            .use(() => Promise.reject(new Error('Missing fruit')))
            .catch(catchFn);
        expect(catchFn).toHaveBeenNthCalledWith(1, expect.objectContaining({ message: 'Missing fruit' }));
    });

    it('can chain the finally function on the async client when successful', async () => {
        expect.assertions(1);
        const finallyFn = jest.fn();
        await createEmptyClient()
            .use(() => Promise.resolve({ fruit: 'apple' as const }))
            .finally(finallyFn);
        expect(finallyFn).toHaveBeenCalledTimes(1);
    });

    it('can chain the finally function on the async client when unsuccessful', async () => {
        expect.assertions(1);
        const finallyFn = jest.fn();
        await createEmptyClient()
            .use(() => Promise.reject(new Error('Missing fruit')))
            .finally(finallyFn)
            .catch(() => {});
        expect(finallyFn).toHaveBeenCalledTimes(1);
    });

    it('does not resolve subsequent asynchronous plugins after an error', async () => {
        expect.assertions(1);
        const subsequentPlugin = jest.fn();
        await createEmptyClient()
            .use(() => Promise.reject(new Error('Missing fruit')))
            .use(subsequentPlugin)
            .catch(() => {});
        expect(subsequentPlugin).not.toHaveBeenCalled();
    });

    it('returns a frozen object when empty', () => {
        expect(createEmptyClient()).toBeFrozenObject();
    });

    it('returns a frozen object when extended by a plugin', () => {
        expect(createEmptyClient().use(() => ({ fruit: 'apple' as const }))).toBeFrozenObject();
    });

    it('returns a frozen object when extended by an asynchronous plugin', () => {
        expect(createEmptyClient().use(() => Promise.resolve({ fruit: 'apple' as const }))).toBeFrozenObject();
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
