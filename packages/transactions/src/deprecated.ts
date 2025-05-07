import { assertIsFullySignedTransaction } from './signatures';

/**
 * From time to time you might acquire a {@link Transaction}, that you expect to be fully signed,
 * from an untrusted network API or user input. Use this function to assert that such a transaction
 * is fully signed.
 *
 * @deprecated Use {@link assertIsFullySignedTransaction} instead. It was only renamed.
 *
 * @example
 * ```ts
 * import { assertTransactionIsFullySigned } from '@solana/transactions';
 *
 * const transaction = getTransactionDecoder().decode(transactionBytes);
 * try {
 *     // If this type assertion function doesn't throw, then Typescript will upcast `transaction`
 *     // to `FullySignedTransaction`.
 *     assertTransactionIsFullySigned(transaction);
 *     // At this point we know that the transaction is signed and can be sent to the network.
 *     await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
 * } catch(e) {
 *     if (isSolanaError(e, SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING)) {
 *         setError(`Missing signatures for ${e.context.addresses.join(', ')}`);
 *     }
 *     throw;
 * }
 * ```
 */
export const assertTransactionIsFullySigned = assertIsFullySignedTransaction;
