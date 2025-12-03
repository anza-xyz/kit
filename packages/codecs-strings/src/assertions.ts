import { SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, SolanaError } from '@solana/errors';

/**
 * Asserts that a given string contains only characters from the specified alphabet.
 *
 * This function validates whether a string consists exclusively of characters
 * from the provided `alphabet`. If the validation fails, it throws an error
 * indicating the invalid base string.
 *
 * @param alphabet - The allowed set of characters for the base encoding.
 * @param testValue - The string to validate against the given alphabet.
 * @param givenValue - The original string provided by the user (defaults to `testValue`).
 *
 * @throws {SolanaError} If `testValue` contains characters not present in `alphabet`.
 *
 * @example
 * Validating a base-8 encoded string.
 * ```ts
 * assertValidBaseString('01234567', '123047'); // Passes
 * assertValidBaseString('01234567', '128');    // Throws error
 * ```
 */
export function assertValidBaseString(alphabet: string, testValue: string, givenValue = testValue) {
    if (!testValue.match(new RegExp(`^[${alphabet}]*$`))) {
        throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE, {
            alphabet,
            base: alphabet.length,
            value: givenValue,
        });
    }
}
