/**
 * Defines a plugin that transforms or extends a client with additional functionality.
 *
 * For instance, plugins may add RPC capabilities, wallet integration, transaction building,
 * or other features necessary for interacting with the Solana blockchain.
 *
 * Plugins are functions that take a client object as input and return a new client object
 * or a promise that resolves to a new client object. This allows for both synchronous
 * and asynchronous transformations and extensions of the client.
 *
 * Plugins are usually applied using the `use` method on a {@link Client} or {@link AsyncClient}
 * instance, which {@link createEmptyClient} provides as a starting point.
 *
 * @typeParam TInput - The input client object type that this plugin accepts.
 * @typeParam TOutput - The output type. Either a new client object or a promise resolving to one.
 *
 * @example Basic RPC plugin
 * Given an RPC endpoint, this plugin adds an `rpc` property to the client.
 *
 * ```ts
 * import { createEmptyClient, createSolanaRpc } from '@solana/kit';
 *
 * // Define a simple RPC plugin.
 * function rpcPlugin(endpoint: string) {
 *     return <T extends object>(client: T) => ({...client, rpc: createSolanaRpc(endpoint) });
 * }
 *
 * // Use the plugin.
 * const client = createEmptyClient().use(rpcPlugin('https://api.mainnet-beta.solana.com'));
 * await client.rpc.getLatestBlockhash().send();
 * ```
 *
 * @example Async plugin that generates a payer wallet
 * The following plugin shows how to create an asynchronous plugin that generates a new keypair signer.
 *
 * ```ts
 * import { createEmptyClient, generateKeypairSigner } from '@solana/kit';
 *
 * // Define a plugin that generates a new keypair signer.
 * function generatedPayerPlugin() {
 *     return async <T extends object>(client: T) => ({...client, payer: await generateKeypairSigner() });
 * }
 *
 * // Use the plugin.
 * const client = await createEmptyClient().use(generatedPayerPlugin());
 * console.log(client.payer.address);
 * ```
 *
 * @example Plugins with input requirements
 * A plugin can specify required properties on the input client. The example below requires the
 * client to already have a `payer` signer attached to the client in order to perform an airdrop.
 *
 * ```ts
 * import { createEmptyClient, TransactionSigner, Lamports, lamports } from '@solana/kit';
 *
 * // Define a plugin that airdrops lamports to the payer set on the client.
 * function airdropPayerPlugin(lamports: Lamports) {
 *     return async <T extends { payer: TransactionSigner }>(client: T) => {
 *         await myAirdropFunction(client.payer, lamports);
 *         return client;
 *     };
 * }
 *
 * // Use the plugins.
 * const client = await createEmptyClient()
 *     .use(generatedPayerPlugin()) // This is required before using the airdrop plugin.
 *     .use(airdropPayerPlugin(lamports(1_000_000_000n)));
 * ```
 *
 * @example Chaining plugins
 * Multiple plugins — asynchronous or not — can be chained together to build up complex clients.
 * The example below demonstrates how to gradually build a client with multiple plugins.
 * Notice how, despite having multiple asynchronous plugins, we only need to `await` the final result.
 * This is because the `use` method on `AsyncClient` returns another `AsyncClient`, allowing for seamless chaining.
 *
 * ```ts
 * import { createEmptyClient, createSolanaRpc, createSolanaRpcSubscriptions, generateKeypairSigner } from '@solana/kit';
 *
 * // Define multiple plugins.
 * function rpcPlugin(endpoint: string) {
 *     return <T extends object>(client: T) => ({...client, rpc: createSolanaRpc(endpoint) });
 * }
 * function rpcSubscriptionsPlugin(endpoint: string) {
 *     return <T extends object>(client: T) => ({...client, rpc: createSolanaRpcSubscriptions(endpoint) });
 * }
 * function generatedPayerPlugin() {
 *     return async <T extends object>(client: T) => ({...client, payer: await generateKeypairSigner() });
 * }
 * function generatedAuthorityPlugin() {
 *     return async <T extends object>(client: T) => ({...client, authority: await generateKeypairSigner() });
 * }
 *
 * // Chain plugins together.
 * const client = await createEmptyClient()
 *     .use(rpcPlugin('https://api.mainnet-beta.solana.com'))
 *     .use(rpcSubscriptionsPlugin('wss://api.mainnet-beta.solana.com'))
 *     .use(generatedPayerPlugin())
 *     .use(generatedAuthorityPlugin());
 * ```
 */
export type ClientPlugin<TInput extends object, TOutput extends Promise<object> | object> = (input: TInput) => TOutput;

/**
 * A client that can be extended with plugins.
 *
 * The `Client` type represents a client object that can be built up through
 * the application of one or more plugins. It provides a `use` method to
 * apply plugins, either synchronously (returning a new `Client`) or
 * asynchronously (returning an {@link AsyncClient}).
 *
 * @typeParam TSelf - The current shape of the client object including all applied plugins.
 */
export type Client<TSelf extends object> = TSelf & {
    /**
     * Applies a plugin to extend or transform the client.
     *
     * @param plugin The plugin function to apply to this client.
     * @returns Either a new `Client` (for sync plugins) or {@link AsyncClient} (for async plugins).
     */
    readonly use: <TOutput extends Promise<object> | object>(
        plugin: ClientPlugin<TSelf, TOutput>,
    ) => TOutput extends Promise<infer U> ? AsyncClient<U extends object ? U : never> : Client<TOutput>;
};

/**
 * An asynchronous wrapper that represents a promise of a client.
 *
 * The `AsyncClient` type is returned when an async plugin is applied to a client.
 * It behaves like a `Promise<Client<TSelf>>` but with an additional `use` method
 * that allows chaining more plugins before the promise resolves.
 *
 * This enables fluent chaining of both synchronous and asynchronous plugins
 * without having to await intermediate promises.
 *
 * @typeParam TSelf - The shape of the client object that this async client will resolve to.
 */
export type AsyncClient<TSelf extends object> = Promise<Client<TSelf>> & {
    /**
     * Applies a plugin to the client once it resolves.
     *
     * @param plugin The plugin function to apply to the resolved client.
     * @returns A new `AsyncClient` representing the result of applying the plugin.
     */
    readonly use: <TOutput extends Promise<object> | object>(
        plugin: ClientPlugin<TSelf, TOutput>,
    ) => AsyncClient<TOutput extends Promise<infer U> ? (U extends object ? U : never) : TOutput>;
};

// TODO(loris): Add examples in this docblock using real plugins once they have been published.

/**
 * Creates a new empty client that can be extended with plugins.
 *
 * This serves as an entry point for building Solana clients.
 * Start with an empty client and chain the `.use()` method
 * to apply plugins that add various functionalities such as RPC
 * connectivity, wallet integration, transaction building, and more.
 *
 * See {@link ClientPlugin} for detailed examples on creating and using plugins.
 *
 * @returns An empty client object with only the `use` method available.
 *
 * @example Basic client setup
 * ```ts
 * import { createEmptyClient } from '@solana/client';
 *
 * const client = createEmptyClient()
 *     .use(myRpcPlugin('https://api.mainnet-beta.solana.com'))
 *     .use(myWalletPlugin());
 * ```
 */
export function createEmptyClient(): Client<object> {
    return addUse({});
}

function addUse<TSelf extends object>(value: TSelf): Client<TSelf> {
    return Object.freeze(
        Object.defineProperties(
            {},
            {
                ...Object.getOwnPropertyDescriptors(value),
                use: {
                    configurable: false,
                    enumerable: true,
                    value: function <TOutput extends Promise<object> | object>(plugin: ClientPlugin<TSelf, TOutput>) {
                        const result = plugin(value);
                        return result instanceof Promise ? createAsyncClient(result) : addUse(result);
                    },
                    writable: false,
                },
            },
        ),
    ) as Client<TSelf>;
}

function createAsyncClient<TSelf extends object>(promise: Promise<TSelf>): AsyncClient<TSelf> {
    return Object.freeze({
        catch(onrejected) {
            return promise.then(v => addUse(v)).catch(onrejected);
        },
        finally(onfinally) {
            return promise.then(v => addUse(v)).finally(onfinally);
        },
        then(onfulfilled, onrejected) {
            return promise.then(v => addUse(v)).then(onfulfilled, onrejected);
        },
        use<TOutput extends Promise<object> | object>(plugin: ClientPlugin<TSelf, TOutput>) {
            return createAsyncClient(promise.then(plugin));
        },
    } as AsyncClient<TSelf>);
}

/**
 * Extends a client object with additional properties, preserving property descriptors
 * (getters, symbol-keyed properties, and non-enumerable properties) from both objects.
 *
 * Use this inside plugins instead of plain object spread (`{...client, ...additions}`)
 * when the client may carry getters or symbol-keyed properties that spread would flatten or lose.
 * When the same key exists on both, `additions` wins.
 *
 * @typeParam TClient - The type of the original client.
 * @typeParam TAdditions - The type of the properties being added.
 * @param client - The original client object to extend.
 * @param additions - The properties to add or override on the client.
 * @returns A new object combining both, with `additions` taking precedence on conflicts.
 *
 * @example
 * ```ts
 * function rpcPlugin(endpoint: string) {
 *     return <T extends object>(client: T) =>
 *         extendClient(client, { rpc: createSolanaRpc(endpoint) });
 * }
 * ```
 *
 * @see {@link ClientPlugin}
 */
export function extendClient<TClient extends object, TAdditions extends object>(
    client: TClient,
    additions: TAdditions,
): Omit<TClient, keyof TAdditions> & TAdditions {
    const result = Object.defineProperties({}, Object.getOwnPropertyDescriptors(client));
    Object.defineProperties(result, Object.getOwnPropertyDescriptors(additions));
    return Object.freeze(result) as Omit<TClient, keyof TAdditions> & TAdditions;
}

/**
 * Wraps a client with a cleanup function, making it {@link Disposable}.
 *
 * Plugin authors can use this to register teardown logic (e.g. closing
 * connections or clearing timers) that runs when the client is disposed.
 * If the client already implements `Symbol.dispose`, the existing dispose
 * logic is chained so that it runs after the new `cleanup` function.
 *
 * @typeParam TClient - The type of the original client.
 * @param client - The client to wrap.
 * @param cleanup - The cleanup function to run when the client is disposed.
 * @return A new client that extends `TClient` and implements `Disposable`.
 *
 * @example
 * Register a cleanup function in a plugin that opens a WebSocket connection.
 * ```ts
 * function myPlugin() {
 *     return <T extends object>(client: T) => {
 *         const socket = new WebSocket('wss://api.example.com');
 *         return withCleanup(
 *             extendClient(client, { socket }),
 *             () => socket.close(),
 *         );
 *     };
 * }
 *
 * // Later, when the client is no longer needed:
 * using client = createEmptyClient().use(myPlugin();
 * // `socket.close()` is called automatically when `client` goes out of scope.
 * ```
 *
 * @see {@link extendClient}
 */
export function withCleanup<TClient extends AsyncDisposable>(client: TClient, cleanup: () => void): TClient;
export function withCleanup<TClient extends object>(client: TClient, cleanup: () => void): Disposable & TClient;
export function withCleanup<TClient extends object>(client: TClient, cleanup: () => void): Disposable & TClient {
    const parentDispose: (() => void) | undefined =
        Symbol.dispose in client ? (client as Disposable)[Symbol.dispose] : undefined;
    const additions: Disposable = {
        [Symbol.dispose]() {
            cleanup();
            parentDispose?.call(client);
        },
    };
    return extendClient(client, additions) as Disposable & TClient;
}

/**
 * Wraps a client with an async cleanup function, making it {@link AsyncDisposable}.
 *
 * Plugin authors can use this to register asynchronous teardown logic (e.g.
 * flushing buffers, closing connections) that runs when the client is disposed.
 * If the client already implements `Symbol.asyncDispose`, it is awaited after
 * the new cleanup. If only `Symbol.dispose` is present, it is called
 * synchronously as a fallback.
 *
 * @typeParam TClient - The type of the original client.
 * @param client - The client to wrap.
 * @param cleanup - The async cleanup function to run when the client is disposed.
 * @return A new client that extends `TClient` and implements `AsyncDisposable`.
 *
 * @example
 * Register an async cleanup function in a plugin that opens a database connection.
 * ```ts
 * function myPlugin() {
 *     return <T extends object>(client: T) => {
 *         const db = await openDatabase();
 *         return withAsyncCleanup(
 *             extendClient(client, { db }),
 *             () => db.close(),
 *         );
 *     };
 * }
 *
 * // Later, when the client is no longer needed:
 * await using client = createEmptyClient().use(myPlugin();
 * // `db.close()` is awaited automatically when `client` goes out of scope.
 * ```
 *
 * @see {@link withCleanup}
 * @see {@link extendClient}
 */
export function withAsyncCleanup<TClient extends object>(
    client: TClient,
    cleanup: () => Promise<void>,
): AsyncDisposable & Omit<TClient, keyof Disposable> {
    const parentDispose: (() => void) | undefined =
        Symbol.dispose in client ? (client as Disposable)[Symbol.dispose] : undefined;
    const parentAsyncDispose: (() => PromiseLike<void>) | undefined =
        Symbol.asyncDispose in client ? (client as AsyncDisposable)[Symbol.asyncDispose] : undefined;
    const additions: AsyncDisposable = {
        async [Symbol.asyncDispose]() {
            await cleanup();
            if (parentAsyncDispose) {
                await parentAsyncDispose.call(client);
            } else {
                parentDispose?.call(client);
            }
        },
    };
    return extendClient(client, additions) as AsyncDisposable & TClient;
}
