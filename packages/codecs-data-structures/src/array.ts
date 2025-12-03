import {
    Codec,
    combineCodec,
    createDecoder,
    createEncoder,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    getEncodedSize,
    ReadonlyUint8Array,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getU32Decoder, getU32Encoder, NumberCodec, NumberDecoder, NumberEncoder } from '@solana/codecs-numbers';

import { assertValidNumberOfItemsForCodec } from './assertions';
import { getFixedSize, getMaxSize } from './utils';

/**
 * Defines the possible size strategies for array-like codecs (`array`, `map`, and `set`).
 *
 * The size of the collection can be determined using one of the following approaches:
 * - A {@link NumberCodec}, {@link NumberDecoder}, or {@link NumberEncoder} to store a size prefix.
 * - A fixed `number` of items, enforcing an exact length.
 * - The string `"remainder"`, which infers the number of items by consuming the rest of the available bytes.
 *   This option is only available when encoding fixed-size items.
 *
 * @typeParam TPrefix - A number codec, decoder, or encoder used for size prefixing.
 */
export type ArrayLikeCodecSize<TPrefix extends NumberCodec | NumberDecoder | NumberEncoder> =
    | TPrefix
    | number
    | 'remainder';

/**
 * Defines the configuration options for array codecs.
 *
 * @typeParam TPrefix - A number codec, decoder, or encoder used for size prefixing.
 */
export type ArrayCodecConfig<TPrefix extends NumberCodec | NumberDecoder | NumberEncoder> = {
    /**
     * Specifies how the size of the array is determined.
     *
     * - A {@link NumberCodec}, {@link NumberDecoder}, or {@link NumberEncoder} stores a size prefix before encoding the array.
     * - A `number` enforces a fixed number of elements.
     * - `"remainder"` uses all remaining bytes to infer the array length (only for fixed-size items).
     *
     * @defaultValue A `u32` size prefix.
     */
    size?: ArrayLikeCodecSize<TPrefix>;
};

/**
 * Returns an encoder for arrays of values.
 *
 * This encoder serializes arrays by encoding each element using the provided item encoder.
 * By default, a `u32` size prefix is included to indicate the number of items in the array.
 * The `size` option can be used to modify this behaviour.
 *
 * For more details, see {@link getArrayCodec}.
 *
 * @typeParam TFrom - The type of the elements in the array.
 *
 * @param item - The encoder for each item in the array.
 * @param config - Optional configuration for the size encoding strategy.
 * @returns A `VariableSizeEncoder<TFrom[]>` for encoding arrays.
 *
 * @example
 * Encoding an array of `u8` numbers.
 * ```ts
 * const encoder = getArrayEncoder(getU8Encoder());
 * const bytes = encoder.encode([1, 2, 3]);
 * // 0x03000000010203
 * //   |       └-- 3 items of 1 byte each.
 * //   └-- 4-byte prefix telling us to read 3 items.
 * ```
 *
 * @see {@link getArrayCodec}
 */
export function getArrayEncoder<TFrom>(
    item: Encoder<TFrom>,
    config: ArrayCodecConfig<NumberEncoder> & { size: 0 },
): FixedSizeEncoder<TFrom[], 0>;
export function getArrayEncoder<TFrom>(
    item: FixedSizeEncoder<TFrom>,
    config: ArrayCodecConfig<NumberEncoder> & { size: number },
): FixedSizeEncoder<TFrom[]>;
export function getArrayEncoder<TFrom>(
    item: Encoder<TFrom>,
    config?: ArrayCodecConfig<NumberEncoder>,
): VariableSizeEncoder<TFrom[]>;
export function getArrayEncoder<TFrom>(
    item: Encoder<TFrom>,
    config: ArrayCodecConfig<NumberEncoder> = {},
): Encoder<TFrom[]> {
    const size = config.size ?? getU32Encoder();
    const fixedSize = computeArrayLikeCodecSize(size, getFixedSize(item));
    const maxSize = computeArrayLikeCodecSize(size, getMaxSize(item)) ?? undefined;

    return createEncoder({
        ...(fixedSize !== null
            ? { fixedSize }
            : {
                  getSizeFromValue: (array: TFrom[]) => {
                      const prefixSize = typeof size === 'object' ? getEncodedSize(array.length, size) : 0;
                      return prefixSize + [...array].reduce((all, value) => all + getEncodedSize(value, item), 0);
                  },
                  maxSize,
              }),
        write: (array: TFrom[], bytes, offset) => {
            if (typeof size === 'number') {
                assertValidNumberOfItemsForCodec('array', size, array.length);
            }
            if (typeof size === 'object') {
                offset = size.write(array.length, bytes, offset);
            }
            array.forEach(value => {
                offset = item.write(value, bytes, offset);
            });
            return offset;
        },
    });
}

/**
 * Returns a decoder for arrays of values.
 *
 * This decoder deserializes arrays by decoding each element using the provided item decoder.
 * By default, a `u32` size prefix is expected to indicate the number of items in the array.
 * The `size` option can be used to modify this behaviour.
 *
 * For more details, see {@link getArrayCodec}.
 *
 * @typeParam TTo - The type of the decoded elements in the array.
 *
 * @param item - The decoder for each item in the array.
 * @param config - Optional configuration for the size decoding strategy.
 * @returns A `VariableSizeDecoder<TTo[]>` for decoding arrays.
 *
 * @example
 * Decoding an array of `u8` numbers.
 * ```ts
 * const decoder = getArrayDecoder(getU8Decoder());
 * const array = decoder.decode(new Uint8Array([0x03, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03]));
 * // [1, 2, 3]
 * // 0x03000000010203
 * //   |       └-- 3 items of 1 byte each.
 * //   └-- 4-byte prefix telling us to read 3 items.
 * ```
 *
 * @see {@link getArrayCodec}
 */
export function getArrayDecoder<TTo>(
    item: Decoder<TTo>,
    config: ArrayCodecConfig<NumberDecoder> & { size: 0 },
): FixedSizeDecoder<TTo[], 0>;
export function getArrayDecoder<TTo>(
    item: FixedSizeDecoder<TTo>,
    config: ArrayCodecConfig<NumberDecoder> & { size: number },
): FixedSizeDecoder<TTo[]>;
export function getArrayDecoder<TTo>(
    item: Decoder<TTo>,
    config?: ArrayCodecConfig<NumberDecoder>,
): VariableSizeDecoder<TTo[]>;
export function getArrayDecoder<TTo>(item: Decoder<TTo>, config: ArrayCodecConfig<NumberDecoder> = {}): Decoder<TTo[]> {
    const size = config.size ?? getU32Decoder();
    const itemSize = getFixedSize(item);
    const fixedSize = computeArrayLikeCodecSize(size, itemSize);
    const maxSize = computeArrayLikeCodecSize(size, getMaxSize(item)) ?? undefined;

    return createDecoder({
        ...(fixedSize !== null ? { fixedSize } : { maxSize }),
        read: (bytes: ReadonlyUint8Array | Uint8Array, offset) => {
            const array: TTo[] = [];
            if (typeof size === 'object' && bytes.slice(offset).length === 0) {
                return [array, offset];
            }

            if (size === 'remainder') {
                while (offset < bytes.length) {
                    const [value, newOffset] = item.read(bytes, offset);
                    offset = newOffset;
                    array.push(value);
                }
                return [array, offset];
            }

            const [resolvedSize, newOffset] = typeof size === 'number' ? [size, offset] : size.read(bytes, offset);
            offset = newOffset;
            for (let i = 0; i < resolvedSize; i += 1) {
                const [value, newOffset] = item.read(bytes, offset);
                offset = newOffset;
                array.push(value);
            }
            return [array, offset];
        },
    });
}

/**
 * Returns a codec for encoding and decoding arrays of values.
 *
 * This codec serializes arrays by encoding each element using the provided item codec.
 * By default, a `u32` size prefix is included to indicate the number of items in the array.
 * The `size` option can be used to modify this behaviour.
 *
 * @typeParam TFrom - The type of the elements to encode.
 * @typeParam TTo - The type of the decoded elements.
 *
 * @param item - The codec for each item in the array.
 * @param config - Optional configuration for the size encoding/decoding strategy.
 * @returns A `VariableSizeCodec<TFrom[], TTo[]>` for encoding and decoding arrays.
 *
 * @example
 * Encoding and decoding an array of `u8` numbers.
 * ```ts
 * const codec = getArrayCodec(getU8Codec());
 * const bytes = codec.encode([1, 2, 3]);
 * // 0x03000000010203
 * //   |       └-- 3 items of 1 byte each.
 * //   └-- 4-byte prefix telling us to read 3 items.
 *
 * const array = codec.decode(bytes);
 * // [1, 2, 3]
 * ```
 *
 * @example
 * Using a `u16` size prefix instead of `u32`.
 * ```ts
 * const codec = getArrayCodec(getU8Codec(), { size: getU16Codec() });
 * const bytes = codec.encode([1, 2, 3]);
 * // 0x0300010203
 * //   |   └-- 3 items of 1 byte each.
 * //   └-- 2-byte prefix telling us to read 3 items.
 * ```
 *
 * @example
 * Using a fixed-size array of 3 items.
 * ```ts
 * const codec = getArrayCodec(getU8Codec(), { size: 3 });
 * codec.encode([1, 2, 3]);
 * // 0x010203
 * //   └-- 3 items of 1 byte each. There must always be 3 items in the array.
 * ```
 *
 * @example
 * Using the `"remainder"` size strategy.
 * ```ts
 * const codec = getArrayCodec(getU8Codec(), { size: 'remainder' });
 * codec.encode([1, 2, 3]);
 * // 0x010203
 * //   └-- 3 items of 1 byte each. The size is inferred from the remainder of the bytes.
 * ```
 *
 * @remarks
 * The size of the array can be controlled using the `size` option:
 * - A `Codec<number>` (e.g. `getU16Codec()`) stores a size prefix before the array.
 * - A `number` enforces a fixed number of elements.
 * - `"remainder"` uses all remaining bytes to infer the array length.
 *
 * Separate {@link getArrayEncoder} and {@link getArrayDecoder} functions are available.
 *
 * ```ts
 * const bytes = getArrayEncoder(getU8Encoder()).encode([1, 2, 3]);
 * const array = getArrayDecoder(getU8Decoder()).decode(bytes);
 * ```
 *
 * @see {@link getArrayEncoder}
 * @see {@link getArrayDecoder}
 */
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config: ArrayCodecConfig<NumberCodec> & { size: 0 },
): FixedSizeCodec<TFrom[], TTo[], 0>;
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: FixedSizeCodec<TFrom, TTo>,
    config: ArrayCodecConfig<NumberCodec> & { size: number },
): FixedSizeCodec<TFrom[], TTo[]>;
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config?: ArrayCodecConfig<NumberCodec>,
): VariableSizeCodec<TFrom[], TTo[]>;
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config: ArrayCodecConfig<NumberCodec> = {},
): Codec<TFrom[], TTo[]> {
    return combineCodec(getArrayEncoder(item, config as object), getArrayDecoder(item, config as object));
}

function computeArrayLikeCodecSize(size: number | object | 'remainder', itemSize: number | null): number | null {
    if (typeof size !== 'number') return null;
    if (size === 0) return 0;
    return itemSize === null ? null : itemSize * size;
}
