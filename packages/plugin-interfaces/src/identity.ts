import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';
import { TransactionSigner } from '@solana/signers';

/**
 * Represents a client that provides a default identity signer.
 *
 * The identity is a {@link TransactionSigner} representing the wallet that owns
 * things in the application — for instance, the authority over accounts, tokens,
 * or other on-chain assets owned by the current user. Unlike {@link ClientWithPayer},
 * which describes the signer responsible for paying transaction fees and storage
 * costs, the identity describes the signer whose assets the application is acting
 * upon. In many apps, the payer and identity refer to the same signer, but they
 * can differ — for example, when a service pays fees on behalf of a user.
 *
 * @example
 * ```ts
 * function getOwnerAddress(client: ClientWithIdentity): Address {
 *     return client.identity.address;
 * }
 * ```
 *
 * @see {@link ClientWithPayer}
 */
export type ClientWithIdentity = { identity: TransactionSigner };

/**
 * Checks whether the provided client has an `identity` installed.
 *
 * The check looks for an own `identity` property on the client without reading it, so a reactive
 * getter installed by a plugin is never invoked.
 *
 * @param client - The client to check.
 * @return `true` if the client has an `identity`, narrowing it to a {@link ClientWithIdentity}.
 *
 * @example
 * ```ts
 * if (isClientWithIdentity(client)) {
 *     console.log(`Acting on behalf of ${client.identity.address}`);
 * }
 * ```
 *
 * @see {@link assertIsClientWithIdentity}
 */
export function isClientWithIdentity(client: object): client is ClientWithIdentity {
    return Object.hasOwn(client, 'identity');
}

/**
 * Asserts that the provided client has an `identity` installed.
 *
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client has no `identity`.
 *
 * @example
 * ```ts
 * function getOwnerAddress(client: object): Address {
 *     assertIsClientWithIdentity(client);
 *     return client.identity.address;
 * }
 * ```
 *
 * @see {@link isClientWithIdentity}
 */
export function assertIsClientWithIdentity(client: object): asserts client is ClientWithIdentity {
    if (!isClientWithIdentity(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['identity'],
        });
    }
}
