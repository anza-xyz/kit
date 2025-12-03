import { SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, SolanaError } from '@solana/errors';

/**
 * Ensures that a given number falls within a specified range.
 *
 * If the number is outside the allowed range, an error is thrown.
 * This function is primarily used to validate values before encoding them in a codec.
 *
 * @param codecDescription - A string describing the codec that is performing the validation.
 * @param min - The minimum allowed value (inclusive).
 * @param max - The maximum allowed value (inclusive).
 * @param value - The number to validate.
 *
 * @throws {@link SolanaError} if the value is out of range.
 *
 * @example
 * Validating a number within range.
 * ```ts
 * assertNumberIsBetweenForCodec('u8', 0, 255, 42); // Passes
 * ```
 *
 * @example
 * Throwing an error for an out-of-range value.
 * ```ts
 * assertNumberIsBetweenForCodec('u8', 0, 255, 300); // Throws
 * ```
 */
export function assertNumberIsBetweenForCodec(
    codecDescription: string,
    min: bigint | number,
    max: bigint | number,
    value: bigint | number,
) {
    if (value < min || value > max) {
        throw new SolanaError(SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, {
            codecDescription,
            max,
            min,
            value,
        });
    }
}
