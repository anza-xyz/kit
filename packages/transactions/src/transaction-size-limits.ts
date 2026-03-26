/**
 * This file defines the size limits for transactions
 * It is used by both transaction-size and transaction-message-size
 * But intentionally not exported from the package
 */

/**
 * The maximum size of a legacy (and v0) transaction in bytes.
 */
export const LEGACY_TRANSACTION_SIZE_LIMIT = 1232;

/**
 * The maximum size of a version 1 transaction in bytes.
 */
export const V1_TRANSACTION_SIZE_LIMIT = 4096;
