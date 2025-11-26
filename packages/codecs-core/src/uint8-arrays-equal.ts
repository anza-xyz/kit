import { ReadonlyUint8Array } from "./readonly-uint8array";

/**
 * Compares two Uint8Arrays for byte-by-byte equality.
 *
 * This utility function performs a length check followed by element-wise comparison
 * to determine if two byte arrays contain identical values. It accepts both mutable
 * `Uint8Array` and `ReadonlyUint8Array` instances, making it suitable for comparing
 * cryptographic signatures, hashes, and other binary data regardless of mutability.
 *
 * The function uses a generic type parameter to ensure type consistency between both
 * arguments, preventing accidental comparisons between mixed array types while still
 * accepting both mutable and readonly variants.
 *
 * @template T - The type of the arrays being compared, constrained to `Uint8Array` or `ReadonlyUint8Array`
 * @param arr1 - The first array to compare
 * @param arr2 - The second array to compare
 * @returns `true` if both arrays have the same length and contain identical byte values at each index, `false` otherwise
 *
 * @example
 * ```ts
 * const signature1 = new Uint8Array([1, 2, 3, 4]);
 * const signature2 = new Uint8Array([1, 2, 3, 4]);
 * const signature3 = new Uint8Array([1, 2, 3, 5]);
 *
 * uint8ArraysEqual(signature1, signature2); // true
 * uint8ArraysEqual(signature1, signature3); // false
 * ```
 *
 * @example
 * ```ts
 * const readonlyBytes: ReadonlyUint8Array = new Uint8Array([10, 20, 30]);
 * const mutableBytes = new Uint8Array([10, 20, 30]);
 *
 * uint8ArraysEqual(readonlyBytes, readonlyBytes); // true - comparing readonly arrays
 * uint8ArraysEqual(mutableBytes, mutableBytes); // true - comparing mutable arrays
 * ```
 */
export function uint8ArraysEqual<T extends Uint8Array | ReadonlyUint8Array>(
    arr1: T,
    arr2: T,
): boolean {
    return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}