import { SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, SolanaError } from '@solana/errors';

import { HEAP_FRAME_SIZE_MULTIPLE, MAX_HEAP_FRAME_SIZE, MIN_HEAP_FRAME_SIZE } from './compute-budget-instruction';

/**
 * Asserts that a requested heap frame size is valid for a transaction.
 *
 * A valid heap size must be a finite integer that is a multiple of
 * {@link HEAP_FRAME_SIZE_MULTIPLE} and falls within the inclusive range defined by
 * {@link MIN_HEAP_FRAME_SIZE} and {@link MAX_HEAP_FRAME_SIZE}.
 *
 * @param heapSize - The requested heap frame size in bytes.
 * @throws {SolanaError} Throws `SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE` when the heap size is
 * invalid.
 *
 * @example
 * ```ts
 * assertIsValidHeapSize(256 * 1024); // succeeds
 * assertIsValidHeapSize(1000); // throws SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE
 * ```
 */
export function assertIsValidHeapSize(heapSize: number): void {
    if (
        !Number.isFinite(heapSize) ||
        !Number.isInteger(heapSize) ||
        heapSize < MIN_HEAP_FRAME_SIZE ||
        heapSize > MAX_HEAP_FRAME_SIZE ||
        heapSize % HEAP_FRAME_SIZE_MULTIPLE !== 0
    ) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE, {
            heapSize,
            maxHeapSize: MAX_HEAP_FRAME_SIZE,
            minHeapSize: MIN_HEAP_FRAME_SIZE,
            multipleOf: HEAP_FRAME_SIZE_MULTIPLE,
        });
    }
}
