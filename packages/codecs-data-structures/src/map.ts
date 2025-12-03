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
import { getTupleDecoder, getTupleEncoder } from './tuple';

/**
 * Defines the configuration options for map codecs.
 *
 * The `size` option determines how the number of entries in the map is stored.
 * It can be:
 * - A {@link NumberCodec} to prefix the map with its size.
 * - A fixed number of entries.
 * - `'remainder'`, which infers the number of entries based on the remaining bytes.
 *   This option is only available for fixed-size keys and values.
 *
 * @typeParam TPrefix - A number codec, encoder, or decoder used for the size prefix.
 */
export type MapCodecConfig<TPrefix extends NumberCodec | NumberDecoder | NumberEncoder> = {
    /**
     * The size of the map.
     * @defaultValue u32 prefix.
     */
    size?: ArrayLikeCodecSize<TPrefix>;
};

/**
 * Returns an encoder for maps.
 *
 * This encoder serializes maps where the keys and values are encoded
 * using the provided key and value encoders. The number of entries
 * is determined by the `size` configuration.
 *
 * For more details, see {@link getMapCodec}.
 *
 * @typeParam TFromKey - The type of the keys before encoding.
 * @typeParam TFromValue - The type of the values before encoding.
 *
 * @param key - The encoder for the map's keys.
 * @param value - The encoder for the map's values.
 * @param config - Configuration options for encoding the map.
 * @returns A `FixedSizeEncoder` or `VariableSizeEncoder` for encoding maps.
 *
 * @example
 * Encoding a map with a `u32` size prefix.
 * ```ts
 * const encoder = getMapEncoder(fixCodecSize(getUtf8Encoder(), 5), getU8Encoder());
 * const bytes = encoder.encode(new Map([['alice', 42], ['bob', 5]]));
 * // 0x02000000616c6963652a626f62000005
 * //   |       |         | |         └── Value (5)
 * //   |       |         | └── Key ("bob", 5 bytes fixed, null-padded)
 * //   |       |         └── Value (42)
 * //   |       └── Key ("alice", 5 bytes fixed)
 * //   └── 4-byte prefix (2 entries)
 * ```
 *
 * @see {@link getMapCodec}
 */
export function getMapEncoder<TFromKey, TFromValue>(
    key: Encoder<TFromKey>,
    value: Encoder<TFromValue>,
    config: MapCodecConfig<NumberEncoder> & { size: 0 },
): FixedSizeEncoder<Map<TFromKey, TFromValue>, 0>;
export function getMapEncoder<TFromKey, TFromValue>(
    key: FixedSizeEncoder<TFromKey>,
    value: FixedSizeEncoder<TFromValue>,
    config: MapCodecConfig<NumberEncoder> & { size: number },
): FixedSizeEncoder<Map<TFromKey, TFromValue>>;
export function getMapEncoder<TFromKey, TFromValue>(
    key: Encoder<TFromKey>,
    value: Encoder<TFromValue>,
    config?: MapCodecConfig<NumberEncoder>,
): VariableSizeEncoder<Map<TFromKey, TFromValue>>;
export function getMapEncoder<TFromKey, TFromValue>(
    key: Encoder<TFromKey>,
    value: Encoder<TFromValue>,
    config: MapCodecConfig<NumberEncoder> = {},
): Encoder<Map<TFromKey, TFromValue>> {
    return transformEncoder(
        getArrayEncoder(getTupleEncoder([key, value]), config as object),
        (map: Map<TFromKey, TFromValue>): [TFromKey, TFromValue][] => [...map.entries()],
    );
}

/**
 * Returns a decoder for maps.
 *
 * This decoder deserializes maps where the keys and values are decoded
 * using the provided key and value decoders. The number of entries
 * is determined by the `size` configuration.
 *
 * For more details, see {@link getMapCodec}.
 *
 * @typeParam TToKey - The type of the keys after decoding.
 * @typeParam TToValue - The type of the values after decoding.
 *
 * @param key - The decoder for the map's keys.
 * @param value - The decoder for the map's values.
 * @param config - Configuration options for decoding the map.
 * @returns A `FixedSizeDecoder` or `VariableSizeDecoder` for decoding maps.
 *
 * @example
 * Decoding a map with a `u32` size prefix.
 * ```ts
 * const decoder = getMapDecoder(fixCodecSize(getUtf8Decoder(), 5), getU8Decoder());
 * const map = decoder.decode(new Uint8Array([
 *   0x02,0x00,0x00,0x00,0x61,0x6c,0x69,0x63,0x65,0x2a,0x62,0x6f,0x62,0x00,0x00,0x05
 * ]));
 * // new Map([['alice', 42], ['bob', 5]])
 * ```
 *
 * @see {@link getMapCodec}
 */
export function getMapDecoder<TToKey, TToValue>(
    key: Decoder<TToKey>,
    value: Decoder<TToValue>,
    config: MapCodecConfig<NumberDecoder> & { size: 0 },
): FixedSizeDecoder<Map<TToKey, TToValue>, 0>;
export function getMapDecoder<TToKey, TToValue>(
    key: FixedSizeDecoder<TToKey>,
    value: FixedSizeDecoder<TToValue>,
    config: MapCodecConfig<NumberDecoder> & { size: number },
): FixedSizeDecoder<Map<TToKey, TToValue>>;
export function getMapDecoder<TToKey, TToValue>(
    key: Decoder<TToKey>,
    value: Decoder<TToValue>,
    config?: MapCodecConfig<NumberDecoder>,
): VariableSizeDecoder<Map<TToKey, TToValue>>;
export function getMapDecoder<TToKey, TToValue>(
    key: Decoder<TToKey>,
    value: Decoder<TToValue>,
    config: MapCodecConfig<NumberDecoder> = {},
): Decoder<Map<TToKey, TToValue>> {
    return transformDecoder(
        getArrayDecoder(getTupleDecoder([key, value]), config as object) as Decoder<[TToKey, TToValue][]>,
        (entries: [TToKey, TToValue][]): Map<TToKey, TToValue> => new Map(entries),
    );
}

/**
 * Returns a codec for encoding and decoding maps.
 *
 * This codec serializes maps where the key/value pairs are encoded
 * and decoded one after another using the provided key and value codecs.
 * The number of entries is determined by the `size` configuration and
 * defaults to a `u32` size prefix.
 *
 * @typeParam TFromKey - The type of the keys before encoding.
 * @typeParam TFromValue - The type of the values before encoding.
 * @typeParam TToKey - The type of the keys after decoding.
 * @typeParam TToValue - The type of the values after decoding.
 *
 * @param key - The codec for the map's keys.
 * @param value - The codec for the map's values.
 * @param config - Configuration options for encoding and decoding the map.
 * @returns A `FixedSizeCodec` or `VariableSizeCodec` for encoding and decoding maps.
 *
 * @example
 * Encoding and decoding a map with a `u32` size prefix (default).
 * ```ts
 * const codec = getMapCodec(fixCodecSize(getUtf8Codec(), 5), getU8Codec());
 * const bytes = codec.encode(new Map([['alice', 42], ['bob', 5]]));
 * // 0x02000000616c6963652a626f62000005
 * //   |       |         | |         └── Value (5)
 * //   |       |         | └── Key ("bob", 5 bytes fixed, null-padded)
 * //   |       |         └── Value (42)
 * //   |       └── Key ("alice", 5 bytes fixed)
 * //   └── 4-byte prefix (2 entries)
 *
 * const map = codec.decode(bytes);
 * // new Map([['alice', 42], ['bob', 5]])
 * ```
 *
 * @example
 * Encoding and decoding a map with a `u16` size prefix.
 * ```ts
 * const codec = getMapCodec(fixCodecSize(getUtf8Codec(), 5), getU8Codec(), { size: getU16Codec() });
 * const bytes = codec.encode(new Map([['alice', 42], ['bob', 5]]));
 * // 0x0200616c6963652a626f62000005
 * //   |   |         | |         └── Value (5)
 * //   |   |         | └── Key ("bob", 5 bytes fixed, null-padded)
 * //   |   |         └── Value (42)
 * //   |   └── Key ("alice", 5 bytes fixed)
 * //   └── 2-byte prefix (2 entries)
 *
 * const map = codec.decode(bytes);
 * // new Map([['alice', 42], ['bob', 5]])
 * ```
 *
 * @example
 * Encoding and decoding a fixed-size map.
 * ```ts
 * const codec = getMapCodec(fixCodecSize(getUtf8Codec(), 5), getU8Codec(), { size: 2 });
 * const bytes = codec.encode(new Map([['alice', 42], ['bob', 5]]));
 * // 0x616c6963652a626f62000005
 * //   |         | |         └── Value (5)
 * //   |         | └── Key ("bob", 5 bytes fixed, null-padded)
 * //   |         └── Value (42)
 * //   └── Key ("alice", 5 bytes fixed)
 *
 * const map = codec.decode(bytes);
 * // new Map([['alice', 42], ['bob', 5]])
 * ```
 *
 * @example
 * Encoding and decoding a map with remainder size.
 * ```ts
 * const codec = getMapCodec(fixCodecSize(getUtf8Codec(), 5), getU8Codec(), { size: 'remainder' });
 * const bytes = codec.encode(new Map([['alice', 42], ['bob', 5]]));
 * // 0x616c6963652a626f62000005
 * //   |         | |         └── Value (5)
 * //   |         | └── Key ("bob", 5 bytes fixed, null-padded)
 * //   |         └── Value (42)
 * //   └── Key ("alice", 5 bytes fixed)
 * // No size prefix, the size is inferred from the remaining bytes.
 *
 * const map = codec.decode(bytes);
 * // new Map([['alice', 42], ['bob', 5]])
 * ```
 *
 * @remarks
 * Separate {@link getMapEncoder} and {@link getMapDecoder} functions are available.
 * ```ts
 * const bytes = getMapEncoder(fixCodecSize(getUtf8Encoder(), 5), getU8Encoder()).encode(new Map([['alice', 42]]));
 * const map = getMapDecoder(fixCodecSize(getUtf8Decoder(), 5), getU8Decoder()).decode(bytes);
 * ```
 *
 * @see {@link getMapEncoder}
 * @see {@link getMapDecoder}
 */
export function getMapCodec<
    TFromKey,
    TFromValue,
    TToKey extends TFromKey = TFromKey,
    TToValue extends TFromValue = TFromValue,
>(
    key: Codec<TFromKey, TToKey>,
    value: Codec<TFromValue, TToValue>,
    config: MapCodecConfig<NumberCodec> & { size: 0 },
): FixedSizeCodec<Map<TFromKey, TFromValue>, Map<TToKey, TToValue>, 0>;
export function getMapCodec<
    TFromKey,
    TFromValue,
    TToKey extends TFromKey = TFromKey,
    TToValue extends TFromValue = TFromValue,
>(
    key: FixedSizeCodec<TFromKey, TToKey>,
    value: FixedSizeCodec<TFromValue, TToValue>,
    config: MapCodecConfig<NumberCodec> & { size: number },
): FixedSizeCodec<Map<TFromKey, TFromValue>, Map<TToKey, TToValue>>;
export function getMapCodec<
    TFromKey,
    TFromValue,
    TToKey extends TFromKey = TFromKey,
    TToValue extends TFromValue = TFromValue,
>(
    key: Codec<TFromKey, TToKey>,
    value: Codec<TFromValue, TToValue>,
    config?: MapCodecConfig<NumberCodec>,
): VariableSizeCodec<Map<TFromKey, TFromValue>, Map<TToKey, TToValue>>;
export function getMapCodec<
    TFromKey,
    TFromValue,
    TToKey extends TFromKey = TFromKey,
    TToValue extends TFromValue = TFromValue,
>(
    key: Codec<TFromKey, TToKey>,
    value: Codec<TFromValue, TToValue>,
    config: MapCodecConfig<NumberCodec> = {},
): Codec<Map<TFromKey, TFromValue>, Map<TToKey, TToValue>> {
    return combineCodec(getMapEncoder(key, value, config as object), getMapDecoder(key, value, config as object));
}
