import { type ReadonlyUint8Array, toArrayBuffer } from '@solana/codecs-core';

import type { Signedness } from './signedness';

/**
 * Configuration options for fixed-point codecs.
 */
export type FixedPointCodecConfig = {
    /**
     * Whether values are serialized in little- or big-endian byte order.
     *
     * @defaultValue `'le'`
     */
    endian?: 'be' | 'le';
};

/**
 * Maps a byte-aligned `totalBits` literal to its byte count. Falls back to
 * `number` when `totalBits` is not a known multiple of 8 between 8 and 256
 * inclusive — in which case the runtime still works, but the literal size
 * generic is erased.
 *
 * @internal
 */
/* eslint-disable typescript-sort-keys/interface */
type TotalBitsToBytesTable = {
    8: 1;
    16: 2;
    24: 3;
    32: 4;
    40: 5;
    48: 6;
    56: 7;
    64: 8;
    72: 9;
    80: 10;
    88: 11;
    96: 12;
    104: 13;
    112: 14;
    120: 15;
    128: 16;
    136: 17;
    144: 18;
    152: 19;
    160: 20;
    168: 21;
    176: 22;
    184: 23;
    192: 24;
    200: 25;
    208: 26;
    216: 27;
    224: 28;
    232: 29;
    240: 30;
    248: 31;
    256: 32;
};
/* eslint-enable typescript-sort-keys/interface */

/**
 * Byte count implied by a fixed-point codec's `totalBits`. Preserves the
 * byte-size literal in the codec type for common widths (multiples of 8
 * from 8 to 256); widens to `number` for other widths.
 *
 * @internal
 */
export type BytesForTotalBits<TTotalBits extends number> = TTotalBits extends keyof TotalBitsToBytesTable
    ? TotalBitsToBytesTable[TTotalBits]
    : number;

const MASK_64 = 0xffffffffffffffffn;
const MASK_32 = 0xffffffffn;
const MASK_16 = 0xffffn;
const MASK_8 = 0xffn;

/**
 * Writes a raw bigint into `bytes` starting at `offset`, using `byteSize`
 * bytes with the given `signedness` and endianness.
 *
 * Signed negative values are serialized using two's-complement semantics:
 * `raw + 2 ** (byteSize * 8)` is written as if unsigned. The caller is
 * expected to have validated that `raw` fits the claimed range.
 *
 * The implementation processes 64-bit chunks via `DataView.setBigUint64`
 * and greedily consumes the remaining 0–7 bytes with at most one
 * `setUint32`, one `setUint16`, and one direct byte write. For common
 * widths this matches `@solana/codecs-numbers` performance exactly.
 *
 * @internal
 */
export function writeRawBigInt(
    bytes: Uint8Array,
    offset: number,
    raw: bigint,
    byteSize: number,
    signedness: Signedness,
    littleEndian: boolean,
): void {
    // Normalize to an unsigned bit pattern so downstream code can treat
    // signed negatives as their two's-complement counterparts.
    const unsigned = signedness === 'signed' && raw < 0n ? raw + (1n << BigInt(byteSize * 8)) : raw;

    const fullChunks = byteSize >> 3;
    const residual = byteSize & 7;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // Full 64-bit chunks. LE lays chunks low-to-high; BE lays higher-order
    // chunks at lower memory addresses.
    for (let c = 0; c < fullChunks; c++) {
        const chunk = (unsigned >> BigInt(c * 64)) & MASK_64;
        const position = littleEndian ? c * 8 : byteSize - (c + 1) * 8;
        view.setBigUint64(offset + position, chunk, littleEndian);
    }

    if (residual > 0) {
        const residualChunk = unsigned >> BigInt(fullChunks * 64);
        // LE: residual bytes follow the chunks. BE: residual occupies the
        // highest-order bytes, which sit at the start of the memory region.
        const residualBase = littleEndian ? fullChunks * 8 : 0;
        let consumed = 0;

        if (residual - consumed >= 4) {
            const chunk = Number((residualChunk >> BigInt(consumed * 8)) & MASK_32);
            const position = littleEndian ? residualBase + consumed : residualBase + residual - consumed - 4;
            view.setUint32(offset + position, chunk, littleEndian);
            consumed += 4;
        }
        if (residual - consumed >= 2) {
            const chunk = Number((residualChunk >> BigInt(consumed * 8)) & MASK_16);
            const position = littleEndian ? residualBase + consumed : residualBase + residual - consumed - 2;
            view.setUint16(offset + position, chunk, littleEndian);
            consumed += 2;
        }
        if (residual - consumed >= 1) {
            const chunk = Number((residualChunk >> BigInt(consumed * 8)) & MASK_8);
            const position = littleEndian ? residualBase + consumed : residualBase + residual - consumed - 1;
            bytes[offset + position] = chunk;
        }
    }
}

/**
 * Reads a raw bigint from `bytes` starting at `offset`, using `byteSize`
 * bytes with the given `signedness` and endianness.
 *
 * Signed values use two's-complement semantics: if the top bit of the
 * decoded unsigned value is set, `2 ** (byteSize * 8)` is subtracted to
 * produce the negative result.
 *
 * The implementation processes 64-bit chunks via `DataView.getBigUint64`
 * and greedily consumes the remaining 0–7 bytes with at most one
 * `getUint32`, one `getUint16`, and one direct byte read.
 *
 * @internal
 */
export function readRawBigInt(
    bytes: ReadonlyUint8Array | Uint8Array,
    offset: number,
    byteSize: number,
    signedness: Signedness,
    littleEndian: boolean,
): bigint {
    const fullChunks = byteSize >> 3;
    const residual = byteSize & 7;
    // `toArrayBuffer` defensively copies when the backing is a
    // SharedArrayBuffer and is safe to call where SharedArrayBuffer is
    // undefined (React Native, non-isolated browser contexts).
    const view = new DataView(toArrayBuffer(bytes, offset, byteSize));
    let unsigned = 0n;

    for (let c = 0; c < fullChunks; c++) {
        const position = littleEndian ? c * 8 : byteSize - (c + 1) * 8;
        const chunk = view.getBigUint64(position, littleEndian);
        unsigned |= chunk << BigInt(c * 64);
    }

    if (residual > 0) {
        const residualBase = littleEndian ? fullChunks * 8 : 0;
        let residualChunk = 0n;
        let consumed = 0;

        if (residual - consumed >= 4) {
            const position = littleEndian ? residualBase + consumed : residualBase + residual - consumed - 4;
            residualChunk |= BigInt(view.getUint32(position, littleEndian)) << BigInt(consumed * 8);
            consumed += 4;
        }
        if (residual - consumed >= 2) {
            const position = littleEndian ? residualBase + consumed : residualBase + residual - consumed - 2;
            residualChunk |= BigInt(view.getUint16(position, littleEndian)) << BigInt(consumed * 8);
            consumed += 2;
        }
        if (residual - consumed >= 1) {
            const position = littleEndian ? residualBase + consumed : residualBase + residual - consumed - 1;
            residualChunk |= BigInt(bytes[offset + position]) << BigInt(consumed * 8);
        }

        unsigned |= residualChunk << BigInt(fullChunks * 64);
    }

    if (signedness === 'signed') {
        const signBit = 1n << BigInt(byteSize * 8 - 1);
        if ((unsigned & signBit) !== 0n) {
            return unsigned - (1n << BigInt(byteSize * 8));
        }
    }
    return unsigned;
}
