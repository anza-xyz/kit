import { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    SOLANA_ERROR__CODECS__INVALID_STRING_FOR_BASE,
    SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES,
    SOLANA_ERROR__CODECS__INVALID_UTF8_STRING,
    SolanaError,
} from '@solana/errors';

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

/**
 * Asserts that a given string can be encoded as UTF-8 without loss.
 *
 * JavaScript strings are sequences of UTF-16 code units and may contain
 * lone surrogates, which have no UTF-8 representation. `TextEncoder`
 * silently replaces them with the replacement character (`U+FFFD`);
 * this function throws instead.
 *
 * @param value - The string to validate.
 *
 * @throws {SolanaError} If `value` contains a lone surrogate.
 *
 * @example
 * ```ts
 * assertIsWellFormedUtf8String('hello 語'); // Passes
 * assertIsWellFormedUtf8String('\ud800');   // Throws error
 * ```
 */
export function assertIsWellFormedUtf8String(value: string) {
    // Fast path: `String.prototype.isWellFormed` (ES2024) where available.
    const isWellFormed = (value as { isWellFormed?: () => boolean }).isWellFormed;
    if (typeof isWellFormed === 'function' && isWellFormed.call(value)) {
        return;
    }
    for (let index = 0; index < value.length; index++) {
        const unit = value.charCodeAt(index);
        if (unit < 0xd800 || unit > 0xdfff) continue;
        const next = value.charCodeAt(index + 1);
        if (unit <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
            index++; // A high surrogate followed by a low surrogate: a valid pair.
            continue;
        }
        throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_STRING, { index, value });
    }
}

/**
 * Finds the first malformed UTF-8 sequence in the given bytes, from the given offset.
 *
 * This rejects everything the Unicode standard rejects: unexpected continuation
 * bytes, overlong encodings, encoded surrogates, code points above `U+10FFFF`
 * and truncated sequences.
 *
 * @param bytes - The byte array to validate.
 * @param offset - The offset from which to start validating (defaults to `0`).
 * @returns The offset at which the first malformed sequence starts, or `-1` if the bytes are well-formed.
 *
 * @example
 * ```ts
 * findMalformedUtf8SequenceOffset(new Uint8Array([0xe8, 0xaa, 0x9e])); // -1 ("語")
 * findMalformedUtf8SequenceOffset(new Uint8Array([0x61, 0xc0, 0x80])); // 1 (overlong)
 * ```
 */
export function findMalformedUtf8SequenceOffset(bytes: ReadonlyUint8Array | Uint8Array, offset = 0): number {
    const length = bytes.length;
    let index = offset;
    while (index < length) {
        const lead = bytes[index];
        let count: number;
        let min = 0x80;
        let max = 0xbf;
        if (lead < 0x80) {
            index++;
            continue;
        } else if (lead >= 0xc2 && lead <= 0xdf) {
            count = 1;
        } else if (lead >= 0xe0 && lead <= 0xef) {
            count = 2;
            if (lead === 0xe0) min = 0xa0; // Overlong.
            if (lead === 0xed) max = 0x9f; // Encoded surrogate.
        } else if (lead >= 0xf0 && lead <= 0xf4) {
            count = 3;
            if (lead === 0xf0) min = 0x90; // Overlong.
            if (lead === 0xf4) max = 0x8f; // Above U+10FFFF.
        } else {
            return index;
        }
        const start = index;
        index++;
        for (let i = 0; i < count; i++, index++) {
            if (index >= length) {
                return start;
            }
            const byte = bytes[index];
            const inRange = i === 0 ? byte >= min && byte <= max : byte >= 0x80 && byte <= 0xbf;
            if (!inRange) {
                return start;
            }
        }
    }
    return -1;
}

/**
 * Asserts that the given bytes, from the given offset, form well-formed UTF-8.
 *
 * `TextDecoder` silently replaces malformed sequences with the replacement
 * character (`U+FFFD`); this function throws instead.
 * See {@link findMalformedUtf8SequenceOffset} for what counts as malformed.
 *
 * @param bytes - The byte array to validate.
 * @param offset - The offset from which to start validating (defaults to `0`).
 *
 * @throws {SolanaError} If a malformed sequence is found, reporting its offset.
 *
 * @example
 * ```ts
 * assertIsWellFormedUtf8Bytes(new Uint8Array([0xe8, 0xaa, 0x9e])); // Passes ("語")
 * assertIsWellFormedUtf8Bytes(new Uint8Array([0xc0, 0x80]));       // Throws error (overlong)
 * ```
 */
export function assertIsWellFormedUtf8Bytes(bytes: ReadonlyUint8Array | Uint8Array, offset = 0) {
    const malformedOffset = findMalformedUtf8SequenceOffset(bytes, offset);
    if (malformedOffset !== -1) {
        throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_UTF8_BYTES, { bytes, offset: malformedOffset });
    }
}
