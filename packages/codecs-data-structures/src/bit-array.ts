import {
    assertByteArrayHasEnoughBytesForCodec,
    combineCodec,
    createDecoder,
    createEncoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
} from '@solana/codecs-core';

/**
 * Defines the configuration options for bit array codecs.
 *
 * A bit array codec encodes an array of booleans into bits, packing them into bytes.
 * This configuration allows adjusting the bit ordering.
 *
 * @see {@link getBitArrayEncoder}
 * @see {@link getBitArrayDecoder}
 * @see {@link getBitArrayCodec}
 */
export type BitArrayCodecConfig = {
    /**
     * Determines whether the bits should be read in reverse order.
     *
     * - `false` (default): The first boolean is stored in the most significant bit (MSB-first).
     * - `true`: The first boolean is stored in the least significant bit (LSB-first).
     *
     * @defaultValue `false`
     */
    backward?: boolean;
};

/**
 * Returns an encoder that packs an array of booleans into bits.
 *
 * This encoder converts a list of `boolean` values into a compact bit representation,
 * storing 8 booleans per byte.
 *
 * The `backward` config option determines whether the bits are stored in MSB-first (`false`)
 * or LSB-first (`true`).
 *
 * For more details, see {@link getBitArrayCodec}.
 *
 * @typeParam TSize - The number of bytes used to store the bit array.
 *
 * @param size - The number of bytes allocated for the bit array (must be sufficient for the expected boolean count).
 * @param config - Configuration options for encoding the bit array.
 * @returns A `FixedSizeEncoder<boolean[], TSize>` for encoding bit arrays.
 *
 * @example
 * Encoding a bit array.
 * ```ts
 * const encoder = getBitArrayEncoder(1);
 *
 * encoder.encode([true, false, true, false, false, false, false, false]);
 * // 0xa0 (0b10100000)
 * ```
 *
 * @see {@link getBitArrayCodec}
 */
export function getBitArrayEncoder<TSize extends number>(
    size: TSize,
    config: BitArrayCodecConfig | boolean = {},
): FixedSizeEncoder<boolean[], TSize> {
    const parsedConfig: BitArrayCodecConfig = typeof config === 'boolean' ? { backward: config } : config;
    const backward = parsedConfig.backward ?? false;
    return createEncoder({
        fixedSize: size,
        write(value: boolean[], bytes, offset) {
            const bytesToAdd: number[] = [];

            for (let i = 0; i < size; i += 1) {
                let byte = 0;
                for (let j = 0; j < 8; j += 1) {
                    const feature = Number(value[i * 8 + j] ?? 0);
                    byte |= feature << (backward ? j : 7 - j);
                }
                if (backward) {
                    bytesToAdd.unshift(byte);
                } else {
                    bytesToAdd.push(byte);
                }
            }

            bytes.set(bytesToAdd, offset);
            return size;
        },
    });
}

/**
 * Returns a decoder that unpacks bits into an array of booleans.
 *
 * This decoder converts a compact bit representation back into a list of `boolean` values.
 * Each byte is expanded into 8 booleans.
 *
 * The `backward` config option determines whether the bits are read in MSB-first (`false`)
 * or LSB-first (`true`).
 *
 * For more details, see {@link getBitArrayCodec}.
 *
 * @typeParam TSize - The number of bytes used to store the bit array.
 *
 * @param size - The number of bytes allocated for the bit array (must be sufficient for the expected boolean count).
 * @param config - Configuration options for decoding the bit array.
 * @returns A `FixedSizeDecoder<boolean[], TSize>` for decoding bit arrays.
 *
 * @example
 * Decoding a bit array.
 * ```ts
 * const decoder = getBitArrayDecoder(1);
 *
 * decoder.decode(new Uint8Array([0xa0]));
 * // [true, false, true, false, false, false, false, false]
 * ```
 *
 * @see {@link getBitArrayCodec}
 */
export function getBitArrayDecoder<TSize extends number>(
    size: TSize,
    config: BitArrayCodecConfig | boolean = {},
): FixedSizeDecoder<boolean[], TSize> {
    const parsedConfig: BitArrayCodecConfig = typeof config === 'boolean' ? { backward: config } : config;
    const backward = parsedConfig.backward ?? false;
    return createDecoder({
        fixedSize: size,
        read(bytes, offset) {
            assertByteArrayHasEnoughBytesForCodec('bitArray', size, bytes, offset);
            const booleans: boolean[] = [];
            let slice = bytes.slice(offset, offset + size);
            slice = backward ? slice.reverse() : slice;

            slice.forEach(byte => {
                for (let i = 0; i < 8; i += 1) {
                    if (backward) {
                        booleans.push(Boolean(byte & 1));
                        byte >>= 1;
                    } else {
                        booleans.push(Boolean(byte & 0b1000_0000));
                        byte <<= 1;
                    }
                }
            });

            return [booleans, offset + size];
        },
    });
}

/**
 * Returns a codec that encodes and decodes boolean arrays as compact bit representations.
 *
 * This codec efficiently stores boolean arrays as bits, packing 8 values per byte.
 * The `backward` config option determines whether bits are stored in MSB-first (`false`)
 * or LSB-first (`true`).
 *
 * @typeParam TSize - The number of bytes used to store the bit array.
 *
 * @param size - The number of bytes allocated for the bit array (must be sufficient for the expected boolean count).
 * @param config - Configuration options for encoding and decoding the bit array.
 * @returns A `FixedSizeCodec<boolean[], boolean[], TSize>` for encoding and decoding bit arrays.
 *
 * @example
 * Encoding and decoding a bit array.
 * ```ts
 * const codec = getBitArrayCodec(1);
 *
 * codec.encode([true, false, true, false, false, false, false, false]);
 * // 0xa0 (0b10100000)
 *
 * codec.decode(new Uint8Array([0xa0]));
 * // [true, false, true, false, false, false, false, false]
 * ```
 *
 * @example
 * Encoding and decoding a bit array backwards.
 * ```ts
 * const codec = getBitArrayCodec(1, { backward: true });
 *
 * codec.encode([true, false, true, false, false, false, false, false]);
 * // 0x05 (0b00000101)
 *
 * codec.decode(new Uint8Array([0x05]));
 * // [true, false, true, false, false, false, false, false]
 * ```
 *
 * @remarks
 * Separate {@link getBitArrayEncoder} and {@link getBitArrayDecoder} functions are available.
 *
 * ```ts
 * const bytes = getBitArrayEncoder(1).encode([true, false, true, false]);
 * const value = getBitArrayDecoder(1).decode(bytes);
 * ```
 *
 * @see {@link getBitArrayEncoder}
 * @see {@link getBitArrayDecoder}
 */
export function getBitArrayCodec<TSize extends number>(
    size: TSize,
    config: BitArrayCodecConfig | boolean = {},
): FixedSizeCodec<boolean[], boolean[], TSize> {
    return combineCodec(getBitArrayEncoder(size, config), getBitArrayDecoder(size, config));
}
