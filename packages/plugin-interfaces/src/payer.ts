import { TransactionSigner } from '@solana/signers';

/**
 * Represents a client that provides a default transaction payer.
 *
 * The payer is a {@link TransactionSigner} used to sign and pay for transactions.
 * Clients implementing this interface can automatically fund transactions
 * without requiring callers to specify a fee payer explicitly. Unlike
 * {@link ClientWithIdentity}, which describes the signer whose assets the
 * application is acting upon, the payer describes the signer responsible for
 * paying transaction fees as well as storage costs — i.e. the minimum balance
 * required to keep newly created accounts alive based on their size.
 * In many apps the payer and identity refer to the same signer, but they can
 * differ — for example, when a service pays fees on behalf of a user.
 *
 * @example
 * ```ts
 * function createTransfer(client: ClientWithPayer, recipient: Address, amount: Lamports) {
 *     const feePayer = client.payer;
 *     // Use feePayer.address as the transaction fee payer
 * }
 * ```
 *
 * @see {@link ClientWithIdentity}
 */
export type ClientWithPayer = { payer: TransactionSigner };
