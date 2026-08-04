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
 * instance, which {@link createClient} provides as a starting point.
 *
 * @typeParam TInput - The input client object type that this plugin accepts.
 * @typeParam TOutput - The output type. Either a new client object or a promise resolving to one.
 *
 * @example Basic RPC plugin
 * Given an RPC endpoint, this plugin adds an `rpc` property to the client.
 *
 * ```ts
 * import { createClient, createSolanaRpc } from '@solana/kit';
 *
 * // Define a simple RPC plugin.
 * function rpcPlugin(endpoint: string) {
 *     return <T extends object>(client: T) => ({...client, rpc: createSolanaRpc(endpoint) });
 * }
 *
 * // Use the plugin.
 * const client = createClient().use(rpcPlugin('https://api.mainnet-beta.solana.com'));
 * await client.rpc.getLatestBlockhash().send();
 * ```
 *
 * @example Async plugin that generates a payer wallet
 * The following plugin shows how to create an asynchronous plugin that generates a new keypair signer.
 *
 * ```ts
 * import { createClient, generateKeypairSigner } from '@solana/kit';
 *
 * // Define a plugin that generates a new keypair signer.
 * function generatedPayerPlugin() {
 *     return async <T extends object>(client: T) => ({...client, payer: await generateKeypairSigner() });
 * }
 *
 * // Use the plugin.
 * const client = await createClient().use(generatedPayerPlugin());
 * console.log(client.payer.address);
 * ```
 *
 * @example Plugins with input requirements
 * A plugin can specify required properties on the input client. The example below requires the
 * client to already have a `payer` signer attached to the client in order to perform an airdrop.
 *
 * ```ts
 * import { createClient, TransactionSigner, Lamports, lamports } from '@solana/kit';
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
 * const client = await createClient()
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
 * import { createClient, createSolanaRpc, createSolanaRpcSubscriptions, generateKeypairSigner } from '@solana/kit';
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
 * const client = await createClient()
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
 * import { createClient } from '@solana/client';
 * import { generatedPayer } from '@solana/kit-plugin-payer';
 * import { rpc } from '@solana/kit-plugin-rpc';
 *
 * const client = await createClient()
 *     .use(generatedPayer())
 *     .use(rpc('https://api.mainnet-beta.solana.com'));
 * ```
 */
export function createClient<TSelf extends object = object>(value?: TSelf): Client<TSelf> {
    return addUse(value ?? ({} as TSelf));
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
 * The result of extending a client of type `TClient` with additional properties of type `TAdditions`.
 *
 * Structurally equivalent to `Omit<TClient, keyof TAdditions> & TAdditions` — keys present
 * on both `TClient` and `TAdditions` are replaced by the `TAdditions` version — but expressed
 * as a single homomorphic mapped type so the inferred type displays as a flat object literal
 * rather than a deeply nested chain of `Omit<...>` intersections. Optional (`?`) and `readonly`
 * modifiers from both sides are preserved.
 *
 * Plugin authors who write their own merging helpers can reuse this type to keep the
 * inferred shape of their plugin's output legible in editor tooltips and error messages.
 *
 * @typeParam TClient - The type of the client being extended.
 * @typeParam TAdditions - The type of the properties being merged in.
 *
 * @example
 * ```ts
 * function withRpc<TClient extends object>(client: TClient, endpoint: string): ExtendedClient<TClient, { rpc: Rpc }> {
 *     return extendClient(client, { rpc: createSolanaRpc(endpoint) });
 * }
 * ```
 *
 * @see {@link extendClient}
 */
export type ExtendedClient<TClient extends object, TAdditions extends object> = {
    [K in keyof (Omit<TClient, keyof TAdditions> & TAdditions)]: (Omit<TClient, keyof TAdditions> & TAdditions)[K];
} & {};

/**
 * Extends a client object with additional properties, preserving property descriptors
 * (getters, symbol-keyed properties, and non-enumerable properties) from both objects.
 *
 * Use this inside plugins instead of plain object spread (`{...client, ...additions}`)
 * when the client may carry getters or symbol-keyed properties that spread would flatten or lose.
 * When the same key exists on both, `additions` wins.
 *
 * The return type is an {@link ExtendedClient}, which flattens the merged shape into a single
 * object literal so chained `extendClient` calls do not accumulate nested `Omit<...>` wrappers
 * in editor tooltips and error messages.
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
 * @see {@link ExtendedClient}
 */
export function extendClient<TClient extends object, TAdditions extends object>(
    client: TClient,
    additions: TAdditions,
): ExtendedClient<TClient, TAdditions> {
    const result = Object.defineProperties({}, toConfigurableDescriptors(Object.getOwnPropertyDescriptors(client)));
    Object.defineProperties(result, Object.getOwnPropertyDescriptors(additions));
    return Object.freeze(result) as ExtendedClient<TClient, TAdditions>;
}

function toConfigurableDescriptors<T extends PropertyDescriptorMap>(descriptors: T): T {
    const result = {} as Record<string | symbol, PropertyDescriptor>;
    for (const key of Reflect.ownKeys(descriptors)) {
        result[key] = { ...descriptors[key as keyof T], configurable: true };
    }
    return result as T;
}

/**
 * Wraps a client with a cleanup function, making it {@link Disposable}.
 *
 * Plugin authors can use this to register teardown logic (e.g. closing
 * connections or clearing timers) that runs when the client is disposed.
 * If the client already implements `Symbol.dispose`, the existing dispose
 * logic is chained so that it runs after the new `cleanup` function.
 *
 * Cleanups run in reverse order of registration, disposal is idempotent, and if more than one
 * cleanup throws then the errors are aggregated into a `SuppressedError` chain. Runtimes that have
 * not shipped explicit resource management are supported too, though a `using` declaration needs a
 * `Symbol.dispose` polyfill there.
 *
 * The return type is an {@link ExtendedClient}, which flattens the merged shape into a
 * single object literal so chained calls do not accumulate nested intersections in editor
 * tooltips and error messages.
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
 * // Build the client in the scope that should own it:
 * using client = createClient().use(myPlugin());
 * // `socket.close()` is called automatically when `client` goes out of scope.
 * ```
 *
 * @example Disposing without a using declaration
 * `using` requires explicit resource management, which Safari has not shipped as of Safari 27.
 * Either dispose the client yourself, as below, or polyfill `Symbol.dispose` — installing the
 * polyfill before any client is created, since a client registers its dispose method under
 * whatever `Symbol.dispose` was at the time.
 * ```ts
 * const client = createClient().use(myPlugin());
 *
 * // Later, when the client is no longer needed:
 * client[Symbol.dispose]();
 * // `socket.close()` has now been called.
 * ```
 *
 * @see {@link extendClient}
 * @see {@link ExtendedClient}
 * @remarks See https://caniuse.com/mdn-javascript_builtins_disposablestack for platform
 * availability of `DisposableStack`.
 */
export function withCleanup<TClient extends object>(
    client: TClient,
    cleanup: () => void,
): ExtendedClient<TClient, Disposable> {
    if (DISPOSABLE_STACK_PROPERTY in client) {
        return addCleanupToClientWithExistingStack(
            client as Record<typeof DISPOSABLE_STACK_PROPERTY, CleanupStack> & TClient,
            cleanup,
        );
    } else {
        return addCleanupToClientWithoutExistingStack(client, cleanup);
    }
}

const DISPOSABLE_STACK_PROPERTY = '__PRIVATE__DISPOSABLE_STACK' as const;

function addCleanupToClientWithExistingStack<TClient extends Record<typeof DISPOSABLE_STACK_PROPERTY, CleanupStack>>(
    client: TClient,
    cleanup: () => void,
): ExtendedClient<TClient, Disposable> {
    // If we already have the stack, add the new cleanup to it
    client[DISPOSABLE_STACK_PROPERTY].defer(cleanup);
    // We assume we already added a dispose method when we added the stack
    return client as unknown as ExtendedClient<TClient, Disposable>;
}

function addCleanupToClientWithoutExistingStack<TClient extends object>(
    client: TClient,
    cleanup: () => void,
): ExtendedClient<TClient, Disposable> {
    const stack = createCleanupStack();

    // If the client has an existing dispose method but not our stack, we maintain this existing cleanup by deferring it to the new stack
    if (Symbol.dispose in client) {
        const existingDispose = (client as Disposable)[Symbol.dispose];
        stack.defer(() => existingDispose.call(client));
    }

    // Add the new cleanup to the stack
    stack.defer(cleanup);

    // We add our stack to the client, and replace any existing dispose method with our stack dispose
    const additions = {
        [DISPOSABLE_STACK_PROPERTY]: stack,
        [Symbol.dispose]() {
            stack.dispose();
        },
    };

    return extendClient(client, additions) as unknown as ExtendedClient<TClient, Disposable>;
}

/**
 * The slice of `DisposableStack` that {@link withCleanup} relies on.
 *
 * Deliberately narrow — `defer()` and the plain `dispose()` method only — so that it can be
 * satisfied both by the platform's `DisposableStack` and by {@link createFallbackCleanupStack} on
 * runtimes that lack one. Note that `dispose()` is used in preference to `[Symbol.dispose]()`
 * because runtimes missing `DisposableStack` are missing `Symbol.dispose` as well.
 */
type CleanupStack = {
    defer(cleanup: () => void): void;
    dispose(): void;
};

function createCleanupStack(): CleanupStack {
    // Always prefer the runtime's own implementation. The fallback exists only for runtimes that
    // have not shipped explicit resource management — most notably Safari, which as of Safari 27
    // provides neither `DisposableStack` nor `Symbol.dispose`.
    return typeof globalThis.DisposableStack === 'function'
        ? new globalThis.DisposableStack()
        : createFallbackCleanupStack();
}

function createFallbackCleanupStack(): CleanupStack {
    const cleanups: (() => void)[] = [];
    let disposed = false;
    return {
        defer(cleanup) {
            if (disposed) {
                // Mirrors the `ReferenceError` thrown by `DisposableStack.prototype.defer` so that
                // both stacks refuse a late cleanup the same way, rather than silently accepting
                // one that will never run.
                throw new ReferenceError('Cannot add values to a disposed stack');
            }
            if (typeof cleanup !== 'function') {
                // `DisposableStack.prototype.defer` rejects a non-callable up front. Deferring that
                // failure to disposal would surface it far from its cause, and would tangle it up in
                // the error aggregation of unrelated cleanups.
                throw new TypeError(`${String(cleanup)} is not a function`);
            }
            cleanups.push(cleanup);
        },
        dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            let error: unknown;
            let hasError = false;
            // Cleanups run in reverse order of registration, and one that throws must not stop the
            // rest from running; their errors are aggregated into a `SuppressedError` chain instead.
            for (let ii = cleanups.length - 1; ii >= 0; ii--) {
                try {
                    cleanups[ii]();
                } catch (e) {
                    error = hasError ? createSuppressedError(e, error) : e;
                    hasError = true;
                }
            }
            cleanups.length = 0;
            if (hasError) {
                throw error;
            }
        },
    };
}

function createSuppressedError(error: unknown, suppressed: unknown): Error {
    // The message `DisposableStack` disposal produces. Passing it explicitly matters: the two-argument
    // form of `SuppressedError` leaves the message empty, which would make an aggregated error read
    // differently depending on which stack produced it.
    const message = 'An error was suppressed during disposal';
    if (typeof globalThis.SuppressedError === 'function') {
        return new globalThis.SuppressedError(error, suppressed, message);
    }
    // A runtime without `DisposableStack` has no `SuppressedError` constructor either, so reproduce
    // its shape on a plain error — including the non-enumerability of every property, so that
    // serializing or spreading the error does not depend on which runtime built it.
    return Object.defineProperties(new Error(message), {
        error: { configurable: true, value: error, writable: true },
        name: { configurable: true, value: 'SuppressedError', writable: true },
        suppressed: { configurable: true, value: suppressed, writable: true },
    });
}
