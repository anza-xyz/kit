import { SOLANA_ERROR__TIMESTAMP_OUT_OF_RANGE, SolanaError } from '@solana/errors';

/**
 * This type represents a Unix timestamp in _seconds_.
 *
 * It is represented as a `bigint` in client code and an `i64` in server code.
 */
export type UnixTimestamp = bigint & { readonly __brand: unique symbol };

// Largest possible value to be represented by an i64
const maxI64Value = 9223372036854775807n; // 2n ** 63n - 1n
const minI64Value = -9223372036854775808n; // -(2n ** 63n)

/**
 * This is a type guard that accepts a `bigint` as input. It will both return `true` if the integer
 * conforms to the {@link UnixTimestamp} type and will refine the type for use in your program.
 *
 * @example
 * ```ts
 * import { isUnixTimestamp } from '@solana/rpc-types';
 *
 * if (isUnixTimestamp(timestamp)) {
 *     // At this point, `timestamp` has been refined to a
 *     // `UnixTimestamp` that can be used anywhere timestamps are expected.
 *     timestamp satisfies UnixTimestamp;
 * } else {
 *     setError(`${timestamp} is not a Unix timestamp`);
 * }
 * ```
 */

export function isUnixTimestamp(putativeTimestamp: bigint): putativeTimestamp is UnixTimestamp {
    return putativeTimestamp >= minI64Value && putativeTimestamp <= maxI64Value;
}

/**
 * Timestamp values returned from the RPC API conform to the type {@link UnixTimestamp}. You can use
 * a value of that type wherever a timestamp is expected.
 *
 * @example
 * From time to time you might acquire a number that you expect to be a timestamp, from an untrusted
 * network API or user input. To assert that such an arbitrary number is usable as a Unix timestamp,
 * use this function.
 *
 * ```ts
 * import { assertIsUnixTimestamp } from '@solana/rpc-types';
 *
 * // Imagine having received a value that you presume represents a timestamp.
 * // At this point we know only that it conforms to the `bigint` type.
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `timestamp` to `UnixTimestamp`.
 *     assertIsUnixTimestamp(timestamp);
 *     // At this point, `timestamp` is a `UnixTimestamp`.
 *     timestamp satisfies UnixTimestamp;
 * } catch (e) {
 *     // `timestamp` turned out not to be a valid Unix timestamp
 * }
 * ```
 */
export function assertIsUnixTimestamp(putativeTimestamp: bigint): asserts putativeTimestamp is UnixTimestamp {
    if (putativeTimestamp < minI64Value || putativeTimestamp > maxI64Value) {
        throw new SolanaError(SOLANA_ERROR__TIMESTAMP_OUT_OF_RANGE, {
            value: putativeTimestamp,
        });
    }
}

/**
 * This helper combines _asserting_ that a `bigint` represents a Unix timestamp with _coercing_ it
 * to the {@link UnixTimestamp} type. It's best used with untrusted input.
 *
 * @example
 * ```ts
 * import { unixTimestamp } from '@solana/rpc-types';
 *
 * const timestamp = unixTimestamp(-42n); // Wednesday, December 31, 1969 3:59:18 PM GMT-08:00
 * ```
 */
export function unixTimestamp(putativeTimestamp: bigint): UnixTimestamp {
    assertIsUnixTimestamp(putativeTimestamp);
    return putativeTimestamp;
}
