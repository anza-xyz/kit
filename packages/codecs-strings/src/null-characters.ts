/**
 * Removes all null characters (`\u0000`) from a string.
 *
 * This function cleans a string by stripping out any null characters,
 * which are often used as padding in fixed-size string encodings.
 *
 * @param value - The string to process.
 * @returns The input string with all null characters removed.
 *
 * @example
 * Removing null characters from a string.
 * ```ts
 * removeNullCharacters('hello\u0000\u0000'); // "hello"
 * ```
 */
export const removeNullCharacters = (value: string) =>
    // eslint-disable-next-line no-control-regex
    value.replace(/\u0000/g, '');

/**
 * Pads a string with null characters (`\u0000`) at the end to reach a fixed length.
 *
 * If the input string is shorter than the specified length, it is padded with null characters
 * until it reaches the desired size. If it is already long enough, it remains unchanged.
 *
 * @param value - The string to pad.
 * @param chars - The total length of the resulting string, including padding.
 * @returns The input string padded with null characters up to the specified length.
 *
 * @example
 * Padding a string with null characters.
 * ```ts
 * padNullCharacters('hello', 8); // "hello\u0000\u0000\u0000"
 * ```
 */
export const padNullCharacters = (value: string, chars: number) => value.padEnd(chars, '\u0000');
