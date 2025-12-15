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
    return Object.freeze({
        ...value,
        use<TOutput extends Promise<object> | object>(plugin: ClientPlugin<TSelf, TOutput>) {
            const result = plugin(value);
            return result instanceof Promise ? createAsyncClient(result) : addUse(result);
        },
    } as Client<TSelf>);
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
