import {
    SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY,
    SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH,
    SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';

import { ReadonlyUint8Array } from './readonly-uint8array';

/**
 * Asserts that a given byte array is not empty (after the optional provided offset).
 *
 * Returns void if the byte array is not empty but throws a {@link SolanaError} otherwise.
 *
 * @param codecDescription - A description of the codec used by the assertion error.
 * @param bytes - The byte array to check.
 * @param offset - The offset from which to start checking the byte array.
 * If provided, the byte array is considered empty if it has no bytes after the offset.
 *
 * @example
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02, 0x03]);
 * assertByteArrayIsNotEmptyForCodec('myCodec', bytes); // OK
 * assertByteArrayIsNotEmptyForCodec('myCodec', bytes, 1); // OK
 * assertByteArrayIsNotEmptyForCodec('myCodec', bytes, 3); // Throws
 * ```
 */
export function assertByteArrayIsNotEmptyForCodec(
    codecDescription: string,
    bytes: ReadonlyUint8Array | Uint8Array,
    offset = 0,
) {
    if (bytes.length - offset <= 0) {
        throw new SolanaError(SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY, {
            codecDescription,
        });
    }
}

/**
 * Asserts that a given byte array has enough bytes to decode
 * (after the optional provided offset).
 *
 * Returns void if the byte array has at least the expected number
 * of bytes but throws a {@link SolanaError} otherwise.
 *
 * @param codecDescription - A description of the codec used by the assertion error.
 * @param expected - The minimum number of bytes expected in the byte array.
 * @param bytes - The byte array to check.
 * @param offset - The offset from which to start checking the byte array.
 *
 * @example
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02, 0x03]);
 * assertByteArrayHasEnoughBytesForCodec('myCodec', 3, bytes); // OK
 * assertByteArrayHasEnoughBytesForCodec('myCodec', 4, bytes); // Throws
 * assertByteArrayHasEnoughBytesForCodec('myCodec', 2, bytes, 1); // OK
 * assertByteArrayHasEnoughBytesForCodec('myCodec', 3, bytes, 1); // Throws
 * ```
 */
export function assertByteArrayHasEnoughBytesForCodec(
    codecDescription: string,
    expected: number,
    bytes: ReadonlyUint8Array | Uint8Array,
    offset = 0,
) {
    const bytesLength = bytes.length - offset;
    if (bytesLength < expected) {
        throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
            bytesLength,
            codecDescription,
            expected,
        });
    }
}

/**
 * Asserts that a given offset is within the byte array bounds.
 * This range is between 0 and the byte array length and is inclusive.
 * An offset equals to the byte array length is considered a valid offset
 * as it allows the post-offset of codecs to signal the end of the byte array.
 *
 * @param codecDescription - A description of the codec used by the assertion error.
 * @param offset - The offset to check.
 * @param bytesLength - The length of the byte array from which the offset should be within bounds.
 *
 * @example
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02, 0x03]);
 * assertByteArrayOffsetIsNotOutOfRange('myCodec', 0, bytes.length); // OK
 * assertByteArrayOffsetIsNotOutOfRange('myCodec', 3, bytes.length); // OK
 * assertByteArrayOffsetIsNotOutOfRange('myCodec', 4, bytes.length); // Throws
 * ```
 */
export function assertByteArrayOffsetIsNotOutOfRange(codecDescription: string, offset: number, bytesLength: number) {
    if (offset < 0 || offset > bytesLength) {
        throw new SolanaError(SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE, {
            bytesLength,
            codecDescription,
            offset,
        });
    }
}
