import { ReadonlyUint8Array } from '@solana/codecs-core';

import { pointIsOnCurve } from './vendor/noble/ed25519';

function byteToHex(byte: number): string {
    const hexString = byte.toString(16);
    if (hexString.length === 1) {
        return `0${hexString}`;
    } else {
        return hexString;
    }
}

function decompressPointBytes(bytes: ReadonlyUint8Array): bigint {
    const hexString = bytes.reduce((acc, byte, ii) => `${byteToHex(ii === 31 ? byte & ~0x80 : byte)}${acc}`, '');
    const integerLiteralString = `0x${hexString}`;
    return BigInt(integerLiteralString);
}

export function compressedPointBytesAreOnCurve(bytes: ReadonlyUint8Array): boolean {
    if (bytes.byteLength !== 32) {
        return false;
    }
    const y = decompressPointBytes(bytes);
    return pointIsOnCurve(y, bytes[31]);
}
