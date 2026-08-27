import {
    SOLANA_ERROR__TRANSACTION__COMPUTE_UNIT_LIMIT_OUT_OF_RANGE,
    SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE,
    SolanaError,
} from '@solana/errors';

import { MAX_COMPUTE_UNIT_LIMIT } from './compute-budget-instruction';

/** The smallest heap frame size that a transaction may request (32 KiB). */
export const MIN_HEAP_SIZE = 32 * 1024;

/** The largest heap frame size that a transaction may request (256 KiB). */
export const MAX_HEAP_SIZE = 256 * 1024;

/** A requested heap frame size must be a whole number of KiB. */
export const HEAP_SIZE_MULTIPLE_OF = 1024;

/**
 * Throws if the given compute unit limit is one the runtime will not honor as written.
 *
 * A transaction may request at most {@link MAX_COMPUTE_UNIT_LIMIT} compute units. Requesting more
 * does not fail the transaction; the runtime clamps the request down to that maximum, so the budget
 * the transaction runs with is silently not the one that was asked for. Values that are not
 * integers are a separate hazard, since they cannot be encoded as a `u32` and are not clamped.
 * Failing here surfaces both at the point the value is set.
 *
 * @param computeUnitLimit - The compute unit limit to check.
 *
 * @throws {SolanaError} Throws `SOLANA_ERROR__TRANSACTION__COMPUTE_UNIT_LIMIT_OUT_OF_RANGE` if the
 * limit is not an integer, is negative, or is greater than {@link MAX_COMPUTE_UNIT_LIMIT}.
 */
export function assertIsValidComputeUnitLimit(computeUnitLimit: number): void {
    if (!Number.isInteger(computeUnitLimit) || computeUnitLimit < 0 || computeUnitLimit > MAX_COMPUTE_UNIT_LIMIT) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__COMPUTE_UNIT_LIMIT_OUT_OF_RANGE, {
            computeUnitLimit,
            maxComputeUnitLimit: MAX_COMPUTE_UNIT_LIMIT,
        });
    }
}

/**
 * Throws if the given heap frame size is one the runtime will not accept.
 *
 * The requested heap size must be a multiple of {@link HEAP_SIZE_MULTIPLE_OF} bytes and lie between
 * {@link MIN_HEAP_SIZE} and {@link MAX_HEAP_SIZE} inclusive. This mirrors the transaction
 * sanitization check performed by the runtime.
 *
 * @param heapSize - The heap frame size, in bytes, to check.
 *
 * @throws {SolanaError} Throws `SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE` if the size is not an
 * integer, is out of range, or is not a whole number of KiB.
 */
export function assertIsValidHeapSize(heapSize: number): void {
    if (
        !Number.isInteger(heapSize) ||
        heapSize < MIN_HEAP_SIZE ||
        heapSize > MAX_HEAP_SIZE ||
        heapSize % HEAP_SIZE_MULTIPLE_OF !== 0
    ) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
            heapSize,
            maxHeapSize: MAX_HEAP_SIZE,
            minHeapSize: MIN_HEAP_SIZE,
            multipleOf: HEAP_SIZE_MULTIPLE_OF,
        });
    }
}
