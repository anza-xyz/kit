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
    return (bytesOffset === 0 || bytesOffset === -bytes.byteLength) && bytesLength === bytes.byteLength
        ? buffer
        : buffer.slice(bytesOffset, bytesOffset + bytesLength);
}
