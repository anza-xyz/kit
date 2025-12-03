import {
    Codec,
    combineCodec,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { NumberCodec, NumberDecoder, NumberEncoder } from '@solana/codecs-numbers';

import { ArrayLikeCodecSize, getArrayDecoder, getArrayEncoder } from './array';

/**
 * Defines the configuration options for set codecs.
 *
 * This configuration allows specifying how the size of the set is encoded.
 * The `size` option can be:
 *
 * - A {@link NumberCodec}, {@link NumberEncoder}, or {@link NumberDecoder} to store the size as a prefix.
 * - A fixed number of items, enforcing a strict length.
 * - The string `'remainder'` to infer the set size from the remaining bytes (only for fixed-size items).
 *
 * @typeParam TPrefix - The type used for encoding the size of the set.
 */
export type SetCodecConfig<TPrefix extends NumberCodec | NumberDecoder | NumberEncoder> = {
    /**
     * The size encoding strategy for the set.
     * @defaultValue Uses a `u32` prefix.
     */
    size?: ArrayLikeCodecSize<TPrefix>;
};

/**
 * Returns an encoder for sets of items.
 *
 * This encoder serializes `Set<T>` values by encoding each item using the provided item encoder.
 * The number of items is stored as a prefix using a `u32` codec by default.
 *
 * For more details, see {@link getSetCodec}.
 *
 * @typeParam TFrom - The type of the items in the set before encoding.
 *
 * @param item - The encoder to use for each set item.
 * @param config - Optional configuration specifying the size strategy.
 * @returns An `Encoder<Set<TFrom>>` for encoding sets of items.
 *
 * @example
 * Encoding a set of `u8` numbers.
 * ```ts
 * const encoder = getSetEncoder(getU8Encoder());
 * const bytes = encoder.encode(new Set([1, 2, 3]));
 * // 0x03000000010203
 * //   |       └-- 3 items of 1 byte each.
 * //   └-- 4-byte prefix indicating 3 items.
 * ```
 *
 * @see {@link getSetCodec}
 */
export function getSetEncoder<TFrom>(
    item: Encoder<TFrom>,
    config: SetCodecConfig<NumberEncoder> & { size: 0 },
): FixedSizeEncoder<Set<TFrom>, 0>;
export function getSetEncoder<TFrom>(
    item: FixedSizeEncoder<TFrom>,
    config: SetCodecConfig<NumberEncoder> & { size: number },
): FixedSizeEncoder<Set<TFrom>>;
export function getSetEncoder<TFrom>(
    item: Encoder<TFrom>,
    config?: SetCodecConfig<NumberEncoder>,
): VariableSizeEncoder<Set<TFrom>>;
export function getSetEncoder<TFrom>(
    item: Encoder<TFrom>,
    config: SetCodecConfig<NumberEncoder> = {},
): Encoder<Set<TFrom>> {
    return transformEncoder(getArrayEncoder(item, config as object), (set: Set<TFrom>): TFrom[] => [...set]);
}

/**
 * Returns a decoder for sets of items.
 *
 * This decoder deserializes a `Set<T>` from a byte array by decoding each item using the provided item decoder.
 * The number of items is determined by a `u32` size prefix by default.
 *
 * For more details, see {@link getSetCodec}.
 *
 * @typeParam TTo - The type of the items in the set after decoding.
 *
 * @param item - The decoder to use for each set item.
 * @param config - Optional configuration specifying the size strategy.
 * @returns A `Decoder<Set<TTo>>` for decoding sets of items.
 *
 * @example
 * Decoding a set of `u8` numbers.
 * ```ts
 * const decoder = getSetDecoder(getU8Decoder());
 * const value = decoder.decode(new Uint8Array([0x03, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03]));
 * // new Set([1, 2, 3])
 * ```
 *
 * @see {@link getSetCodec}
 */
export function getSetDecoder<TTo>(
    item: Decoder<TTo>,
    config: SetCodecConfig<NumberDecoder> & { size: 0 },
): FixedSizeDecoder<Set<TTo>, 0>;
export function getSetDecoder<TTo>(
    item: FixedSizeDecoder<TTo>,
    config: SetCodecConfig<NumberDecoder> & { size: number },
): FixedSizeDecoder<Set<TTo>>;
export function getSetDecoder<TTo>(
    item: Decoder<TTo>,
    config?: SetCodecConfig<NumberDecoder>,
): VariableSizeDecoder<Set<TTo>>;
export function getSetDecoder<TTo>(item: Decoder<TTo>, config: SetCodecConfig<NumberDecoder> = {}): Decoder<Set<TTo>> {
    return transformDecoder(getArrayDecoder(item, config as object), (entries: TTo[]): Set<TTo> => new Set(entries));
}

/**
 * Returns a codec for encoding and decoding sets of items.
 *
 * This codec serializes `Set<T>` values by encoding each item using the provided item codec.
 * The number of items is stored as a prefix using a `u32` codec by default.
 *
 * @typeParam TFrom - The type of the items in the set before encoding.
 * @typeParam TTo - The type of the items in the set after decoding.
 *
 * @param item - The codec to use for each set item.
 * @param config - Optional configuration specifying the size strategy.
 * @returns A `Codec<Set<TFrom>, Set<TTo>>` for encoding and decoding sets.
 *
 * @example
 * Encoding and decoding a set of `u8` numbers.
 * ```ts
 * const codec = getSetCodec(getU8Codec());
 * const bytes = codec.encode(new Set([1, 2, 3]));
 * // 0x03000000010203
 * //   |       └-- 3 items of 1 byte each.
 * //   └-- 4-byte prefix indicating 3 items.
 *
 * const value = codec.decode(bytes);
 * // new Set([1, 2, 3])
 * ```
 *
 * @example
 * Using a `u16` prefix for size.
 * ```ts
 * const codec = getSetCodec(getU8Codec(), { size: getU16Codec() });
 * const bytes = codec.encode(new Set([1, 2, 3]));
 * // 0x0300010203
 * //   |   └-- 3 items of 1 byte each.
 * //   └-- 2-byte prefix indicating 3 items.
 * ```
 *
 * @example
 * Using a fixed-size set.
 * ```ts
 * const codec = getSetCodec(getU8Codec(), { size: 3 });
 * const bytes = codec.encode(new Set([1, 2, 3]));
 * // 0x010203
 * //   └-- Exactly 3 items of 1 byte each.
 * ```
 *
 * @example
 * Using remainder to infer set size.
 * ```ts
 * const codec = getSetCodec(getU8Codec(), { size: 'remainder' });
 * const bytes = codec.encode(new Set([1, 2, 3]));
 * // 0x010203
 * //   └-- 3 items of 1 byte each. The size is inferred from the remaining bytes.
 * ```
 *
 * @remarks
 * Separate {@link getSetEncoder} and {@link getSetDecoder} functions are available.
 *
 * ```ts
 * const bytes = getSetEncoder(getU8Encoder()).encode(new Set([1, 2, 3]));
 * const value = getSetDecoder(getU8Decoder()).decode(bytes);
 * ```
 *
 * @see {@link getSetEncoder}
 * @see {@link getSetDecoder}
 */
export function getSetCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config: SetCodecConfig<NumberCodec> & { size: 0 },
): FixedSizeCodec<Set<TFrom>, Set<TTo>, 0>;
export function getSetCodec<TFrom, TTo extends TFrom = TFrom>(
    item: FixedSizeCodec<TFrom, TTo>,
    config: SetCodecConfig<NumberCodec> & { size: number },
): FixedSizeCodec<Set<TFrom>, Set<TTo>>;
export function getSetCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config?: SetCodecConfig<NumberCodec>,
): VariableSizeCodec<Set<TFrom>, Set<TTo>>;
export function getSetCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config: SetCodecConfig<NumberCodec> = {},
): Codec<Set<TFrom>, Set<TTo>> {
    return combineCodec(getSetEncoder(item, config as object), getSetDecoder(item, config as object));
}
