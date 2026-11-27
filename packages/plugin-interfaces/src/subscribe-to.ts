import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

/**
 * Convention for advertising that a client capability is reactive.
 *
 * A plugin whose capability can change over time (for example, a wallet
 * plugin whose `client.payer` is reassigned as the user connects, switches
 * accounts, or disconnects) installs a sibling
 * `subscribeTo<Capability>(listener): () => void` function alongside the
 * capability itself. Reactive consumers (framework hooks, stores, effects)
 * can then observe changes without having to name the specific plugin that
 * installed the capability — they duck-type on the subscribe hook.
 *
 * The listener is invoked whenever the observable value of the capability
 * may have changed; consumers should re-read the capability to get the
 * current value. Over-notification is acceptable — consumers that bail on
 * reference-equal snapshots (such as React's `useSyncExternalStore`) will
 * filter redundant notifications out for free.
 *
 * Plugins whose capability is fixed for the lifetime of the client (e.g. a
 * static `payer(signer)` plugin) do not need to install this function.
 * Consumers that care about reactivity should fall back to a no-op subscribe
 * and read the capability once.
 *
 * This module defines the convention for `client.payer` and `client.identity`.
 * See {@link ClientWithSubscribeToPayer} and {@link ClientWithSubscribeToIdentity}.
 */

/**
 * Registers a listener for changes to a reactive client capability. Returns
 * an unsubscribe function.
 *
 * Calling the returned unsubscribe more than once is safe — it must be
 * idempotent.
 */
export type SubscribeToFn = (listener: () => void) => () => void;

/**
 * Represents a client that advertises `client.payer` as reactive.
 *
 * A plugin that can mutate `client.payer` over time installs this sibling
 * function so that reactive consumers can re-read the capability without
 * having to know which plugin installed it.
 *
 * The listener is invoked whenever the observable value of `client.payer`
 * may have changed; consumers should re-read `client.payer` to get the
 * current value.
 *
 * @example
 * ```ts
 * import { type ClientWithPayer, type ClientWithSubscribeToPayer } from '@solana/plugin-interfaces';
 *
 * function observePayer(client: ClientWithPayer & ClientWithSubscribeToPayer) {
 *     return client.subscribeToPayer(() => {
 *         console.log('payer is now', client.payer);
 *     });
 * }
 * ```
 *
 * @see {@link ClientWithPayer}
 * @see {@link ClientWithSubscribeToIdentity}
 */
export type ClientWithSubscribeToPayer = {
    /**
     * Registers a listener to be called whenever `client.payer` may have
     * changed. Returns an unsubscribe function.
     */
    readonly subscribeToPayer: SubscribeToFn;
};

/**
 * Represents a client that advertises `client.identity` as reactive.
 *
 * A plugin that can mutate `client.identity` over time installs this sibling
 * function so that reactive consumers can re-read the capability without
 * having to know which plugin installed it.
 *
 * The listener is invoked whenever the observable value of `client.identity`
 * may have changed; consumers should re-read `client.identity` to get the
 * current value.
 *
 * @example
 * ```ts
 * import { type ClientWithIdentity, type ClientWithSubscribeToIdentity } from '@solana/plugin-interfaces';
 *
 * function observeIdentity(client: ClientWithIdentity & ClientWithSubscribeToIdentity) {
 *     return client.subscribeToIdentity(() => {
 *         console.log('identity is now', client.identity);
 *     });
 * }
 * ```
 *
 * @see {@link ClientWithIdentity}
 * @see {@link ClientWithSubscribeToPayer}
 */
export type ClientWithSubscribeToIdentity = {
    /**
     * Registers a listener to be called whenever `client.identity` may have
     * changed. Returns an unsubscribe function.
     */
    readonly subscribeToIdentity: SubscribeToFn;
};

/**
 * Checks whether the provided client advertises `client.payer` as reactive by having a
 * `subscribeToPayer` function installed.
 *
 * @param client - The client to check.
 * @return `true` if the client has a `subscribeToPayer` function, narrowing it to a
 * {@link ClientWithSubscribeToPayer}.
 *
 * @example
 * ```ts
 * const unsubscribe = isClientWithSubscribeToPayer(client)
 *     ? client.subscribeToPayer(onPayerChange)
 *     : () => {};
 * ```
 *
 * @see {@link assertIsClientWithSubscribeToPayer}
 */
export function isClientWithSubscribeToPayer(client: object): client is ClientWithSubscribeToPayer {
    return Object.hasOwn(client, 'subscribeToPayer');
}

/**
 * Asserts that the provided client advertises `client.payer` as reactive by having a
 * `subscribeToPayer` function installed.
 *
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client has no `subscribeToPayer` function.
 *
 * @example
 * ```ts
 * function observePayer(client: ClientWithPayer) {
 *     assertIsClientWithSubscribeToPayer(client);
 *     return client.subscribeToPayer(() => {
 *         console.log('payer is now', client.payer);
 *     });
 * }
 * ```
 *
 * @see {@link isClientWithSubscribeToPayer}
 */
export function assertIsClientWithSubscribeToPayer(client: object): asserts client is ClientWithSubscribeToPayer {
    if (!isClientWithSubscribeToPayer(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['subscribeToPayer'],
        });
    }
}

/**
 * Checks whether the provided client advertises `client.identity` as reactive by having a
 * `subscribeToIdentity` function installed.
 *
 * @param client - The client to check.
 * @return `true` if the client has a `subscribeToIdentity` function, narrowing it to a
 * {@link ClientWithSubscribeToIdentity}.
 *
 * @example
 * ```ts
 * const unsubscribe = isClientWithSubscribeToIdentity(client)
 *     ? client.subscribeToIdentity(onIdentityChange)
 *     : () => {};
 * ```
 *
 * @see {@link assertIsClientWithSubscribeToIdentity}
 */
export function isClientWithSubscribeToIdentity(client: object): client is ClientWithSubscribeToIdentity {
    return Object.hasOwn(client, 'subscribeToIdentity');
}

/**
 * Asserts that the provided client advertises `client.identity` as reactive by having a
 * `subscribeToIdentity` function installed.
 *
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client has no `subscribeToIdentity` function.
 *
 * @example
 * ```ts
 * function observeIdentity(client: ClientWithIdentity) {
 *     assertIsClientWithSubscribeToIdentity(client);
 *     return client.subscribeToIdentity(() => {
 *         console.log('identity is now', client.identity);
 *     });
 * }
 * ```
 *
 * @see {@link isClientWithSubscribeToIdentity}
 */
export function assertIsClientWithSubscribeToIdentity(client: object): asserts client is ClientWithSubscribeToIdentity {
    if (!isClientWithSubscribeToIdentity(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['subscribeToIdentity'],
        });
    }
}
