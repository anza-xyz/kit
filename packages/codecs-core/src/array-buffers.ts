import { ReadonlyUint8Array } from './readonly-uint8array';

/**
 * Converts a `Uint8Array` to an `ArrayBuffer`. If the underlying buffer is a `SharedArrayBuffer`,
 * it will be copied to a non-shared buffer, for safety.
 *
 * A negative `offset` counts back from the end of the byte array, the same way
 * `Array.prototype.slice` does.
 *
 * @remarks
 * Source: https://stackoverflow.com/questions/37228285/uint8array-to-arraybuffer
 */
export function toArrayBuffer(bytes: ReadonlyUint8Array | Uint8Array, offset?: number, length?: number): ArrayBuffer {
    const bytesLength = length ?? bytes.byteLength;
    let bytesOffset = offset ?? 0;
    if (bytesOffset < 0) {
        // Resolve a negative offset against the end of the byte array, like `Array.prototype.slice`.
        bytesOffset = Math.max(bytes.byteLength + bytesOffset, 0);
    }
    let buffer: ArrayBuffer;
    if (typeof SharedArrayBuffer === 'undefined' || !(bytes.buffer instanceof SharedArrayBuffer)) {
        buffer = bytes.buffer as ArrayBuffer;
        bytesOffset += bytes.byteOffset;
    } else {
        buffer = new ArrayBuffer(bytes.length);
        new Uint8Array(buffer).set(new Uint8Array(bytes));
    }
    return bytesOffset === 0 && bytesLength === buffer.byteLength
        ? buffer
        : buffer.slice(bytesOffset, bytesOffset + bytesLength);
}
