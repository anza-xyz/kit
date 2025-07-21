import { ReadonlyUint8Array } from './readonly-uint8array';

/**
 * Concatenates an array of `Uint8Array`s into a single `Uint8Array`.
 * Reuses the original byte array when applicable.
 *
 * @param byteArrays - The array of byte arrays to concatenate.
 *
 * @example
 * ```ts
 * const bytes1 = new Uint8Array([0x01, 0x02]);
 * const bytes2 = new Uint8Array([]);
 * const bytes3 = new Uint8Array([0x03, 0x04]);
 * const bytes = mergeBytes([bytes1, bytes2, bytes3]);
 * //    ^ [0x01, 0x02, 0x03, 0x04]
 * ```
 */
export const mergeBytes = (byteArrays: Uint8Array[]): Uint8Array => {
    const nonEmptyByteArrays = byteArrays.filter(arr => arr.length);
    if (nonEmptyByteArrays.length === 0) {
        return byteArrays.length ? byteArrays[0] : new Uint8Array();
    }

    if (nonEmptyByteArrays.length === 1) {
        return nonEmptyByteArrays[0];
    }

    const totalLength = nonEmptyByteArrays.reduce((total, arr) => total + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    nonEmptyByteArrays.forEach(arr => {
        result.set(arr, offset);
        offset += arr.length;
    });
    return result;
};

/**
 * Pads a `Uint8Array` with zeroes to the specified length.
 * If the array is longer than the specified length, it is returned as-is.
 *
 * @param bytes - The byte array to pad.
 * @param length - The desired length of the byte array.
 *
 * @example
 * Adds zeroes to the end of the byte array to reach the desired length.
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02]);
 * const paddedBytes = padBytes(bytes, 4);
 * //    ^ [0x01, 0x02, 0x00, 0x00]
 * ```
 *
 * @example
 * Returns the original byte array if it is already at the desired length.
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02]);
 * const paddedBytes = padBytes(bytes, 2);
 * // bytes === paddedBytes
 * ```
 */
export function padBytes(bytes: Uint8Array, length: number): Uint8Array;
export function padBytes(bytes: ReadonlyUint8Array, length: number): ReadonlyUint8Array;
export function padBytes(bytes: ReadonlyUint8Array, length: number): ReadonlyUint8Array {
    if (bytes.length >= length) return bytes;
    const paddedBytes = new Uint8Array(length).fill(0);
    paddedBytes.set(bytes);
    return paddedBytes;
}

/**
 * Fixes a `Uint8Array` to the specified length.
 * If the array is longer than the specified length, it is truncated.
 * If the array is shorter than the specified length, it is padded with zeroes.
 *
 * @param bytes - The byte array to truncate or pad.
 * @param length - The desired length of the byte array.
 *
 * @example
 * Truncates the byte array to the desired length.
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
 * const fixedBytes = fixBytes(bytes, 2);
 * //    ^ [0x01, 0x02]
 * ```
 *
 * @example
 * Adds zeroes to the end of the byte array to reach the desired length.
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02]);
 * const fixedBytes = fixBytes(bytes, 4);
 * //    ^ [0x01, 0x02, 0x00, 0x00]
 * ```
 *
 * @example
 * Returns the original byte array if it is already at the desired length.
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02]);
 * const fixedBytes = fixBytes(bytes, 2);
 * // bytes === fixedBytes
 * ```
 */
export const fixBytes = (bytes: ReadonlyUint8Array | Uint8Array, length: number): ReadonlyUint8Array | Uint8Array =>
    padBytes(bytes.length <= length ? bytes : bytes.slice(0, length), length);

/**
 * Returns true if and only if the provided `data` byte array contains
 * the provided `bytes` byte array at the specified `offset`.
 *
 * @param data - The byte sequence to search for.
 * @param bytes - The byte array in which to search for `data`.
 * @param offset - The position in `bytes` where the search begins.
 *
 * @example
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
 * const data = new Uint8Array([0x02, 0x03]);
 * containsBytes(bytes, data, 1); // true
 * containsBytes(bytes, data, 2); // false
 * ```
 */
export function containsBytes(
    data: ReadonlyUint8Array | Uint8Array,
    bytes: ReadonlyUint8Array | Uint8Array,
    offset: number,
): boolean {
    const slice = offset === 0 && data.length === bytes.length ? data : data.slice(offset, offset + bytes.length);
    if (slice.length !== bytes.length) return false;
    return bytes.every((b, i) => b === slice[i]);
}
