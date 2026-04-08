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
