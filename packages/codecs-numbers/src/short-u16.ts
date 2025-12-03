import {
    combineCodec,
    createDecoder,
    createEncoder,
    Offset,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';

import { assertNumberIsBetweenForCodec } from './assertions';

/**
 * Returns an encoder for `shortU16` values.
 *
 * This encoder serializes `shortU16` values using **1 to 3 bytes**.
 * Smaller values use fewer bytes, while larger values take up more space.
 *
 * For more details, see {@link getShortU16Codec}.
 *
 * @returns A `VariableSizeEncoder<number | bigint>` for encoding `shortU16` values.
 *
 * @example
 * Encoding a `shortU16` value.
 * ```ts
 * const encoder = getShortU16Encoder();
 * encoder.encode(42);    // 0x2a
 * encoder.encode(128);   // 0x8001
 * encoder.encode(16384); // 0x808001
 * ```
 *
 * @see {@link getShortU16Codec}
 */
export const getShortU16Encoder = (): VariableSizeEncoder<bigint | number> =>
    createEncoder({
        getSizeFromValue: (value: bigint | number): number => {
            if (value <= 0b01111111) return 1;
            if (value <= 0b0011111111111111) return 2;
            return 3;
        },
        maxSize: 3,
        write: (value: bigint | number, bytes: Uint8Array, offset: Offset): Offset => {
            assertNumberIsBetweenForCodec('shortU16', 0, 65535, value);
            const shortU16Bytes = [0];
            for (let ii = 0; ; ii += 1) {
                // Shift the bits of the value over such that the next 7 bits are at the right edge.
                const alignedValue = Number(value) >> (ii * 7);
                if (alignedValue === 0) {
                    // No more bits to consume.
                    break;
                }
                // Extract those 7 bits using a mask.
                const nextSevenBits = 0b1111111 & alignedValue;
                shortU16Bytes[ii] = nextSevenBits;
                if (ii > 0) {
                    // Set the continuation bit of the previous slice.
                    shortU16Bytes[ii - 1] |= 0b10000000;
                }
            }
            bytes.set(shortU16Bytes, offset);
            return offset + shortU16Bytes.length;
        },
    });

/**
 * Returns a decoder for `shortU16` values.
 *
 * This decoder deserializes `shortU16` values from **1 to 3 bytes**.
 * The number of bytes used depends on the encoded value.
 *
 * For more details, see {@link getShortU16Codec}.
 *
 * @returns A `VariableSizeDecoder<number>` for decoding `shortU16` values.
 *
 * @example
 * Decoding a `shortU16` value.
 * ```ts
 * const decoder = getShortU16Decoder();
 * decoder.decode(new Uint8Array([0x2a]));             // 42
 * decoder.decode(new Uint8Array([0x80, 0x01]));       // 128
 * decoder.decode(new Uint8Array([0x80, 0x80, 0x01])); // 16384
 * ```
 *
 * @see {@link getShortU16Codec}
 */
export const getShortU16Decoder = (): VariableSizeDecoder<number> =>
    createDecoder({
        maxSize: 3,
        read: (bytes: ReadonlyUint8Array | Uint8Array, offset): [number, Offset] => {
            let value = 0;
            let byteCount = 0;
            while (++byteCount) {
                const byteIndex = byteCount - 1;
                const currentByte = bytes[offset + byteIndex];
                const nextSevenBits = 0b1111111 & currentByte;
                // Insert the next group of seven bits into the correct slot of the output value.
                value |= nextSevenBits << (byteIndex * 7);
                if ((currentByte & 0b10000000) === 0) {
                    // This byte does not have its continuation bit set. We're done.
                    break;
                }
            }
            return [value, offset + byteCount];
        },
    });

/**
 * Returns a codec for encoding and decoding `shortU16` values.
 *
 * It serializes unsigned integers using **1 to 3 bytes** based on the encoded value.
 * The larger the value, the more bytes it uses.
 *
 * - If the value is `<= 0x7f` (127), it is stored in a **single byte**
 *   and the first bit is set to `0` to indicate the end of the value.
 * - Otherwise, the first bit is set to `1` to indicate that the value continues in the next byte, which follows the same pattern.
 * - This process repeats until the value is fully encoded in up to 3 bytes. The third and last byte, if needed, uses all 8 bits to store the remaining value.
 *
 * In other words, the encoding scheme follows this structure:
 *
 * ```txt
 * 0XXXXXXX                   <- Values 0 to 127 (1 byte)
 * 1XXXXXXX 0XXXXXXX          <- Values 128 to 16,383 (2 bytes)
 * 1XXXXXXX 1XXXXXXX XXXXXXXX <- Values 16,384 to 4,194,303 (3 bytes)
 * ```
 *
 * @returns A `VariableSizeCodec<number | bigint, number>` for encoding and decoding `shortU16` values.
 *
 * @example
 * Encoding and decoding `shortU16` values.
 * ```ts
 * const codec = getShortU16Codec();
 * const bytes1 = codec.encode(42);    // 0x2a
 * const bytes2 = codec.encode(128);   // 0x8001
 * const bytes3 = codec.encode(16384); // 0x808001
 *
 * codec.decode(bytes1); // 42
 * codec.decode(bytes2); // 128
 * codec.decode(bytes3); // 16384
 * ```
 *
 * @remarks
 * This codec efficiently stores small numbers, making it useful for transactions and compact representations.
 *
 * If you need a fixed-size `u16` codec, consider using {@link getU16Codec}.
 *
 * Separate {@link getShortU16Encoder} and {@link getShortU16Decoder} functions are available.
 *
 * ```ts
 * const bytes = getShortU16Encoder().encode(42);
 * const value = getShortU16Decoder().decode(bytes);
 * ```
 *
 * @see {@link getShortU16Encoder}
 * @see {@link getShortU16Decoder}
 */
export const getShortU16Codec = (): VariableSizeCodec<bigint | number, number> =>
    combineCodec(getShortU16Encoder(), getShortU16Decoder());
