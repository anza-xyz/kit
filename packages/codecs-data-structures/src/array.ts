import {
    Codec,
    combineCodec,
    containsBytes,
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
import { SOLANA_ERROR__CODECS__SENTINEL_MISSING_AT_END_OF_BYTES, SolanaError } from '@solana/errors';

import { assertValidNumberOfItemsForCodec } from './assertions';
import { getFixedSize, getMaxSize } from './utils';

/**
 * Defines whether the sentinel of a {@link ArrayLikeCodecSentinelSize} strategy is written when
 * encoding and required when decoding.
 *
 * This mirrors the `sentinelCountStrategy` enumeration of Codama's `sentinelCountNode`.
 *
 * - `"required"` — The sentinel is written after the last item and must be present when decoding.
 *   Reaching the end of the byte array without it is an error. This is the default.
 * - `"optional"` — The sentinel is written after the last item; when decoding, it is consumed if
 *   present but the collection may also end at the end of the byte array. Use this to tolerate
 *   tightly sized or legacy data that lacks the sentinel.
 * - `"omitted"` — The sentinel is never written; when decoding, it is consumed if present and the
 *   collection also ends at the end of the byte array. Only meaningful when the collection is
 *   followed by unused space or the end of the byte array.
 *
 * Under `"optional"` and `"omitted"`, the sentinel must be no wider than the smallest possible item
 * (see the constraints on {@link ArrayLikeCodecSentinelSize}).
 *
 * @see {@link ArrayLikeCodecSentinelSize}
 */
export type SentinelCountStrategy = 'omitted' | 'optional' | 'required';

/**
 * A size strategy for array-like codecs where the collection ends when the bytes at the next item
 * position match a constant `sentinel`, compared at item boundaries only.
 *
 * Unlike {@link addCodecSentinel}, the sentinel is never searched for within an item's bytes, so its
 * bytes may occur _inside_ an item without terminating the collection. This mirrors Codama's
 * `sentinelCountNode`.
 *
 * @remarks
 * Because the sentinel is only compared at the start of the next item slot, two invariants must hold
 * for the collection to round-trip correctly. The codec does **not** enforce them — like Codama's
 * `sentinelCountNode`, it is the caller's (or IDL author's) responsibility to guarantee them:
 *
 * 1. **No item may _begin_ with the sentinel's bytes.** A valid item that starts with the sentinel
 *    is indistinguishable from the terminator, so decoding would stop early at that item. The
 *    sentinel may still appear _inside_ an item, just never at its start.
 * 2. **Under `"optional"` and `"omitted"`, the sentinel must be no wider than the smallest possible
 *    item.** Otherwise a trailing region shorter than the sentinel but large enough to hold a valid
 *    item would be skipped: decoding stops as soon as fewer bytes than the sentinel remain, so that
 *    final item would never be read. This cannot arise under `"required"` because a terminator is
 *    always written.
 *
 * @example
 * A single `0xff` byte is a poor sentinel for a list of public keys: roughly one key in 256 starts
 * with `0xff`, so such a key would prematurely terminate the list. A sentinel as wide as an item —
 * for instance the all-zero (default) public key — avoids this, since only that exact key can ever
 * match the terminator.
 *
 * @see {@link SentinelCountStrategy}
 */
export type ArrayLikeCodecSentinelSize = {
    /** Internal discriminator identifying this object as a sentinel size strategy. */
    readonly __kind: 'sentinel';
    /**
     * The fixed-size constant compared against the bytes at each item position.
     *
     * No valid item may begin with these bytes, and under the `"optional"` / `"omitted"` strategies
     * this must be no wider than the smallest possible item. See the remarks above.
     */
    readonly sentinel: ReadonlyUint8Array;
    /**
     * Whether the sentinel is written when encoding and required when decoding.
     *
     * @defaultValue `"required"`
     */
    readonly strategy?: SentinelCountStrategy;
};

/**
 * Defines the possible size strategies for array-like codecs (`array`, `map`, and `set`).
 *
 * The size of the collection can be determined using one of the following approaches:
 * - A {@link NumberCodec}, {@link NumberDecoder}, or {@link NumberEncoder} to store a size prefix.
 * - A fixed `number` of items, enforcing an exact length.
 * - The string `"remainder"`, which infers the number of items by consuming the rest of the available bytes.
 * - An {@link ArrayLikeCodecSentinelSize} object, which ends the collection when the bytes at the next
 *   item position match a constant sentinel.
 *
 * @typeParam TPrefix - A number codec, decoder, or encoder used for size prefixing.
 */
export type ArrayLikeCodecSize<TPrefix extends NumberCodec | NumberDecoder | NumberEncoder> =
    | ArrayLikeCodecSentinelSize
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
     * An optional description for the codec, that will be used in error messages.
     */
    description?: string;
    /**
     * Whether a size prefix must be present when decoding.
     *
     * By default, when the size is stored as a prefix and there are no bytes left to read,
     * the decoder returns an empty array instead of failing. This allows new collections to be
     * appended to existing data layouts without breaking the decoding of older data.
     * Set this option to `true` to throw when the size prefix is missing.
     *
     * Only applies when the `size` option is a number codec.
     *
     * @defaultValue `false`
     */
    requireSizePrefix?: boolean;
    /**
     * Specifies how the size of the array is determined.
     *
     * - A {@link NumberCodec}, {@link NumberDecoder}, or {@link NumberEncoder} stores a size prefix before encoding the array.
     * - A `number` enforces a fixed number of elements.
     * - `"remainder"` uses all remaining bytes to infer the array length (only for fixed-size items).
     * - An {@link ArrayLikeCodecSentinelSize} object ends the array when the bytes at the next item
     *   position match a constant sentinel.
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
 * @param config - Optional configuration for the size encoding strategy and description.
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
                      const prefixSize = isPrefixSize(size) ? getEncodedSize(array.length, size) : 0;
                      const suffixSize = isSentinelSize(size) && size.strategy !== 'omitted' ? size.sentinel.length : 0;
                      return (
                          prefixSize +
                          suffixSize +
                          [...array].reduce((all, value) => all + getEncodedSize(value, item), 0)
                      );
                  },
                  maxSize,
              }),
        write: (array: TFrom[], bytes, offset) => {
            if (typeof size === 'number') {
                assertValidNumberOfItemsForCodec(config.description ?? 'array', size, array.length);
            }
            if (isPrefixSize(size)) {
                offset = size.write(array.length, bytes, offset);
            }
            array.forEach(value => {
                offset = item.write(value, bytes, offset);
            });
            if (isSentinelSize(size) && size.strategy !== 'omitted') {
                bytes.set(size.sentinel, offset);
                offset += size.sentinel.length;
            }
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
            if (isPrefixSize(size) && !config.requireSizePrefix && offset >= bytes.length) {
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

            if (isSentinelSize(size)) {
                const { sentinel, strategy = 'required' } = size;
                while (true) {
                    if (offset + sentinel.length > bytes.length) {
                        // Not enough bytes remain to hold the sentinel.
                        if (strategy === 'required') {
                            throw new SolanaError(SOLANA_ERROR__CODECS__SENTINEL_MISSING_AT_END_OF_BYTES, {
                                hexSentinel: hexBytes(sentinel),
                                sentinel,
                            });
                        }
                        break;
                    }
                    if (containsBytes(bytes, sentinel, offset)) {
                        // The sentinel is present; consume it and stop.
                        offset += sentinel.length;
                        break;
                    }
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
 * @example
 * Using a sentinel to mark the end of the array. Note that no valid item may begin with the
 * sentinel's bytes, or decoding would stop early — see {@link ArrayLikeCodecSentinelSize} for the
 * full constraints.
 * ```ts
 * const codec = getArrayCodec(getU8Codec(), { size: { __kind: 'sentinel', sentinel: new Uint8Array([0]) } });
 * codec.encode([1, 2, 3]);
 * // 0x01020300
 * //   |      └-- The sentinel that marks the end of the array.
 * //   └-- 3 items of 1 byte each.
 * ```
 *
 * @example
 * Requiring the size prefix to be present when decoding.
 * ```ts
 * getArrayCodec(getU8Codec()).decode(new Uint8Array([]));
 * // [] (an exhausted byte array decodes as an empty array by default).
 *
 * getArrayCodec(getU8Codec(), { requireSizePrefix: true }).decode(new Uint8Array([]));
 * // Throws: the size prefix is missing.
 * ```
 *
 * @remarks
 * The size of the array can be controlled using the `size` option:
 * - A `Codec<number>` (e.g. `getU16Codec()`) stores a size prefix before the array.
 * - A `number` enforces a fixed number of elements.
 * - `"remainder"` uses all remaining bytes to infer the array length.
 *
 * When the size is stored as a prefix, decoding an exhausted byte array yields an empty array,
 * which allows arrays to be appended to existing data layouts without breaking older data.
 * Use the `requireSizePrefix` option to throw instead.
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

/** Narrows an array-like size to a numeric prefix codec, decoder, or encoder. */
function isPrefixSize(size: unknown): size is NumberCodec | NumberDecoder | NumberEncoder {
    return typeof size === 'object' && size !== null && !isSentinelSize(size);
}

/** Narrows an array-like size to an {@link ArrayLikeCodecSentinelSize} object. */
function isSentinelSize(size: unknown): size is ArrayLikeCodecSentinelSize {
    return typeof size === 'object' && size !== null && '__kind' in size && size.__kind === 'sentinel';
}

function hexBytes(bytes: ReadonlyUint8Array): string {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}
