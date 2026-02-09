import { TransactionSigner } from '@solana/signers';

/**
 * Represents a client that provides a default transaction payer.
 *
 * The payer is a {@link TransactionSigner} used to sign and pay for transactions.
 * Clients implementing this interface can automatically fund transactions
 * without requiring callers to specify a fee payer explicitly.
 *
 * @example
 * ```ts
 * function createTransfer(client: ClientWithPayer, recipient: Address, amount: Lamports) {
 *     const feePayer = client.payer;
 *     // Use feePayer.address as the transaction fee payer
 * }
 * ```
 */
export type ClientWithPayer = { payer: TransactionSigner };
