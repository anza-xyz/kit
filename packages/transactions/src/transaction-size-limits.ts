/**
 * The maximum size of a legacy (and v0) transaction in bytes.
 *
 * @example
 * ```ts
 * import { LEGACY_TRANSACTION_SIZE_LIMIT } from '@solana/transactions';
 *
 * const remainingBytes = LEGACY_TRANSACTION_SIZE_LIMIT - getTransactionSize(transaction);
 * ```
 *
 * @see {@link V1_TRANSACTION_SIZE_LIMIT}
 * @see {@link getTransactionSizeLimit}
 */
export const LEGACY_TRANSACTION_SIZE_LIMIT = 1232;

/**
 * The maximum size of a version 1 transaction in bytes.
 *
 * @example
 * ```ts
 * import { V1_TRANSACTION_SIZE_LIMIT } from '@solana/transactions';
 *
 * const remainingBytes = V1_TRANSACTION_SIZE_LIMIT - getTransactionSize(transaction);
 * ```
 *
 * @see {@link LEGACY_TRANSACTION_SIZE_LIMIT}
 * @see {@link getTransactionSizeLimit}
 */
export const V1_TRANSACTION_SIZE_LIMIT = 4096;
