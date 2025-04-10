import { SOLANA_ERROR__MALFORMED_BIGINT_STRING, SolanaError } from '@solana/errors';

/**
 * This type represents a `bigint` which has been encoded as a string for transit over a transport
 * that does not support `bigint` values natively. The JSON-RPC is such a transport.
 */
export type StringifiedBigInt = string & { readonly __brand: unique symbol };

/**
 * A type guard that returns `true` if the input string parses as a `BigInt`, and refines its type
 * for use in your program.
 *
 * @example
 * ```ts
 * import { isStringifiedBigInt } from '@solana/rpc-types';
 *
 * if (isStringifiedBigInt(bigintString)) {
 *     // At this point, `bigintString` has been refined to a `StringifiedBigInt`
 *     bigintString satisfies StringifiedBigInt; // OK
 * } else {
 *     setError(`${bigintString} does not represent a BigInt`);
 * }
 * ```
 */
export function isStringifiedBigInt(putativeBigInt: string): putativeBigInt is StringifiedBigInt {
    try {
        BigInt(putativeBigInt);
        return true;
    } catch {
        return false;
    }
}

/**
 * From time to time you might acquire a string, that you expect to parse as a `BigInt`, from an
 * untrusted network API or user input. Use this function to assert that such an arbitrary string
 * will in fact parse as a `BigInt`.
 *
 * @example
 * ```ts
 * import { assertIsStringifiedBigInt } from '@solana/rpc-types';
 *
 * // Imagine having received a value that you presume represents the supply of some token.
 * // At this point we know only that it conforms to the `string` type.
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `supplyString` to `StringifiedBigInt`.
 *     assertIsStringifiedBigInt(supplyString);
 *     // At this point, `supplyString` is a `StringifiedBigInt`.
 *     supplyString satisfies StringifiedBigInt;
 * } catch (e) {
 *     // `supplyString` turned out not to parse as a `BigInt`
 * }
 * ```
 */
export function assertIsStringifiedBigInt(putativeBigInt: string): asserts putativeBigInt is StringifiedBigInt {
    try {
        BigInt(putativeBigInt);
    } catch {
        throw new SolanaError(SOLANA_ERROR__MALFORMED_BIGINT_STRING, {
            value: putativeBigInt,
        });
    }
}

/**
 * This helper combines _asserting_ that a string will parse as a `BigInt` with _coercing_ it to the
 * {@link StringifiedBigInt} type. It's best used with untrusted input.
 *
 * @example
 * ```ts
 * import { stringifiedBigInt } from '@solana/rpc-types';
 *
 * const supplyString = stringifiedBigInt('1000000000');
 * ```
 */
export function stringifiedBigInt(putativeBigInt: string): StringifiedBigInt {
    assertIsStringifiedBigInt(putativeBigInt);
    return putativeBigInt;
}
