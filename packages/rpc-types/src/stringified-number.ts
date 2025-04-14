import { SOLANA_ERROR__MALFORMED_NUMBER_STRING, SolanaError } from '@solana/errors';

/**
 * This type represents a number which has been encoded as a string for transit over a transport
 * where loss of precision when using the native number type is a concern. The JSON-RPC is such a
 * transport.
 */
export type StringifiedNumber = string & { readonly __brand: unique symbol };

/**
 * A type guard that returns `true` if the input string parses as a `Number`, and refines its type
 * for use in your program.
 *
 * @example
 * ```ts
 * import { isStringifiedNumber } from '@solana/rpc-types';
 *
 * if (isStringifiedNumber(numericString)) {
 *     // At this point, `numericString` has been refined to a `StringifiedNumber`
 *     numericString satisfies StringifiedNumber; // OK
 * } else {
 *     setError(`${numericString} does not represent a number`);
 * }
 * ```
 */
export function isStringifiedNumber(putativeNumber: string): putativeNumber is StringifiedNumber {
    return !Number.isNaN(Number(putativeNumber));
}

/**
 * From time to time you might acquire a string, that you expect to parse as a `Number`, from an
 * untrusted network API or user input. Use this function to assert that such an arbitrary string
 * will in fact parse as a `Number`.
 *
 * @example
 * ```ts
 * import { assertIsStringifiedNumber } from '@solana/rpc-types';
 *
 * // Imagine having received a value that you presume represents some decimal number.
 * // At this point we know only that it conforms to the `string` type.
 * try {
 *     // If this type assertion function doesn't throw, then
 *     // Typescript will upcast `decimalNumberString` to `StringifiedNumber`.
 *     assertIsStringifiedNumber(decimalNumberString);
 *     // At this point, `decimalNumberString` is a `StringifiedNumber`.
 *     decimalNumberString satisfies StringifiedNumber;
 * } catch (e) {
 *     // `decimalNumberString` turned out not to parse as a number.
 * }
 * ```
 */
export function assertIsStringifiedNumber(putativeNumber: string): asserts putativeNumber is StringifiedNumber {
    if (Number.isNaN(Number(putativeNumber))) {
        throw new SolanaError(SOLANA_ERROR__MALFORMED_NUMBER_STRING, {
            value: putativeNumber,
        });
    }
}

/**
 * This helper combines _asserting_ that a string will parse as a `Number` with _coercing_ it to the
 * {@link StringifiedNumber} type. It's best used with untrusted input.
 *
 * @example
 * ```ts
 * import { stringifiedNumber } from '@solana/rpc-types';
 *
 * const decimalNumberString = stringifiedNumber('-42.1');
 * ```
 */
export function stringifiedNumber(putativeNumber: string): StringifiedNumber {
    assertIsStringifiedNumber(putativeNumber);
    return putativeNumber;
}
