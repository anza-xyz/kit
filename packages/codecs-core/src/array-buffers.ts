import { ReadonlyUint8Array } from './readonly-uint8array';

/**
 * Converts a `Uint8Array` to an `ArrayBuffer`. If the underlying buffer is a `SharedArrayBuffer`,
 * it will be copied to a non-shared buffer, for safety.
 *
 * @remarks
 * Source: https://stackoverflow.com/questions/37228285/uint8array-to-arraybuffer
 */
export function toArrayBuffer(bytes: ReadonlyUint8Array | Uint8Array, offset?: number, length?: number): ArrayBuffer {
    const bytesOffset = bytes.byteOffset + (offset ?? 0);
    const bytesLength = length ?? bytes.byteLength;
    let buffer: ArrayBuffer;
    if (typeof SharedArrayBuffer === 'undefined') {
        buffer = bytes.buffer as ArrayBuffer;
    } else if (bytes.buffer instanceof SharedArrayBuffer) {
        buffer = new ArrayBuffer(bytes.length);
        new Uint8Array(buffer).set(new Uint8Array(bytes));
    } else {
        buffer = bytes.buffer;
    }
    // Resolve the offset against the end of the buffer before deriving the end index, the same way
    // `Array.prototype.slice` does. Passing a negative `bytesOffset` straight to `buffer.slice()`
    // would compute an end index of `bytesOffset + bytesLength` that can cross zero — e.g. an offset
    // of -1 and a length of 1 becomes `slice(-1, 0)`, which yields an empty buffer instead of the
    // final byte.
    const startIndex =
        bytesOffset < 0 ? Math.max(buffer.byteLength + bytesOffset, 0) : Math.min(bytesOffset, buffer.byteLength);
    return startIndex === 0 && bytesLength === buffer.byteLength
        ? buffer
        : buffer.slice(startIndex, startIndex + bytesLength);
}
