import {
    assertIsFixedSize,
    Codec,
    combineCodec,
    containsBytes,
    Decoder,
    Encoder,
    fixDecoderSize,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    fixEncoderSize,
    ReadonlyUint8Array,
    transformDecoder,
    transformEncoder,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import {
    getBooleanDecoder,
    getBooleanEncoder,
    getConstantDecoder,
    getConstantEncoder,
    getTupleDecoder,
    getTupleEncoder,
    getUnionDecoder,
    getUnionEncoder,
    getUnitDecoder,
    getUnitEncoder,
} from '@solana/codecs-data-structures';
import {
    FixedSizeNumberCodec,
    FixedSizeNumberDecoder,
    FixedSizeNumberEncoder,
    getU8Decoder,
    getU8Encoder,
    NumberCodec,
    NumberDecoder,
    NumberEncoder,
} from '@solana/codecs-numbers';

import { isOption, isSome, None, none, Option, OptionOrNullable, Some, some } from './option';
import { wrapNullable } from './unwrap-option';

/**
 * Defines the configuration options for {@link Option} codecs.
 *
 * The `getOptionCodec` function behaves similarly to {@link getNullableCodec}
 * but encodes `Option<T>` types instead of `T | null` types.
 *
 * This configuration controls how {@link None} values are encoded and how presence
 * is determined when decoding.
 *
 * @typeParam TPrefix - A number codec, encoder, or decoder used as the presence prefix.
 *
 * @see {@link getOptionEncoder}
 * @see {@link getOptionDecoder}
 * @see {@link getOptionCodec}
 */
export type OptionCodecConfig<TPrefix extends NumberCodec | NumberDecoder | NumberEncoder> = {
    /**
     * Specifies how {@link None} values are represented in the encoded data.
     *
     * - By default, {@link None} values are omitted from encoding.
     * - `'zeroes'`: The bytes allocated for the value are filled with zeroes. This requires a fixed-size codec for the item.
     * - Custom byte array: {@link None} values are replaced with a predefined byte sequence. This results in a variable-size codec.
     *
     * @defaultValue No explicit `noneValue` is used; {@link None} values are omitted.
     */
    noneValue?: ReadonlyUint8Array | 'zeroes';

    /**
     * The presence prefix used to distinguish between {@link None} and present values.
     *
     * - By default, a `u8` prefix is used (`0 = None`, `1 = Some`).
     * - Custom number codec: Allows defining a different number size for the prefix.
     * - `null`: No prefix is used; `noneValue` (if provided) determines {@link None}.
     *   If no `noneValue` is set, {@link None} is identified by the absence of bytes.
     *
     * @defaultValue `u8` prefix.
     */
    prefix?: TPrefix | null;
};

/**
 * Returns an encoder for optional values using the {@link Option} type.
 *
 * This encoder serializes an {@link OptionOrNullable} value using a configurable approach:
 * - By default, a `u8` prefix is used (`0 = None`, `1 = Some`). This can be customized or disabled.
 * - If `noneValue: 'zeroes'` is set, {@link None} values are encoded as zeroes.
 * - If `noneValue` is a byte array, {@link None} values are replaced with the provided constant.
 *
 * Unlike {@link getNullableEncoder}, this encoder accepts both {@link Option} and {@link Nullable} values.
 *
 * For more details, see {@link getOptionCodec}.
 *
 * @typeParam TFrom - The type of the main value being encoded.
 *
 * @param item - The encoder for the value that may be present.
 * @param config - Configuration options for encoding optional values.
 * @returns A `FixedSizeEncoder` or `VariableSizeEncoder` for encoding option values.
 *
 * @example
 * Encoding an optional string.
 * ```ts
 * const stringCodec = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
 * const encoder = getOptionEncoder(stringCodec);
 *
 * encoder.encode(some('Hi'));
 * encoder.encode('Hi');
 * // 0x01020000004869
 * //   | |       └-- utf8 string content ("Hi").
 * //   | └-- u32 string prefix (2 characters).
 * //   └-- 1-byte prefix (Some).
 *
 * encoder.encode(none());
 * encoder.encode(null);
 * // 0x00
 * //   └-- 1-byte prefix (None).
 * ```
 *
 * @see {@link getOptionCodec}
 */
export function getOptionEncoder<TFrom, TSize extends number>(
    item: FixedSizeEncoder<TFrom, TSize>,
    config: OptionCodecConfig<NumberEncoder> & { noneValue: 'zeroes'; prefix: null },
): FixedSizeEncoder<OptionOrNullable<TFrom>, TSize>;
export function getOptionEncoder<TFrom>(
    item: FixedSizeEncoder<TFrom>,
    config: OptionCodecConfig<FixedSizeNumberEncoder> & { noneValue: 'zeroes' },
): FixedSizeEncoder<OptionOrNullable<TFrom>>;
export function getOptionEncoder<TFrom>(
    item: FixedSizeEncoder<TFrom>,
    config: OptionCodecConfig<NumberEncoder> & { noneValue: 'zeroes' },
): VariableSizeEncoder<OptionOrNullable<TFrom>>;
export function getOptionEncoder<TFrom>(
    item: Encoder<TFrom>,
    config?: OptionCodecConfig<NumberEncoder> & { noneValue?: ReadonlyUint8Array },
): VariableSizeEncoder<OptionOrNullable<TFrom>>;
export function getOptionEncoder<TFrom>(
    item: Encoder<TFrom>,
    config: OptionCodecConfig<NumberEncoder> = {},
): Encoder<OptionOrNullable<TFrom>> {
    const prefix = (() => {
        if (config.prefix === null) {
            return transformEncoder(getUnitEncoder(), (_boolean: boolean) => undefined);
        }
        return getBooleanEncoder({ size: config.prefix ?? getU8Encoder() });
    })();
    const noneValue = (() => {
        if (config.noneValue === 'zeroes') {
            assertIsFixedSize(item);
            return fixEncoderSize(getUnitEncoder(), item.fixedSize);
        }
        if (!config.noneValue) {
            return getUnitEncoder();
        }
        return getConstantEncoder(config.noneValue);
    })();

    return getUnionEncoder(
        [
            transformEncoder(getTupleEncoder([prefix, noneValue]), (_value: None | null): [boolean, void] => [
                false,
                undefined,
            ]),
            transformEncoder(getTupleEncoder([prefix, item]), (value: Some<TFrom> | TFrom): [boolean, TFrom] => [
                true,
                isOption(value) && isSome(value) ? value.value : value,
            ]),
        ],
        variant => {
            const option = isOption<TFrom>(variant) ? variant : wrapNullable(variant);
            return Number(isSome(option));
        },
    );
}

/**
 * Returns a decoder for optional values using the {@link Option} type.
 *
 * This decoder deserializes an `Option<T>` value using a configurable approach:
 * - By default, a `u8` prefix is used (`0 = None`, `1 = Some`). This can be customized or disabled.
 * - If `noneValue: 'zeroes'` is set, `None` values are identified by zeroes.
 * - If `noneValue` is a byte array, `None` values match the provided constant.
 *
 * Unlike {@link getNullableDecoder}, this decoder always outputs an {@link Option} type.
 *
 * For more details, see {@link getOptionCodec}.
 *
 * @typeParam TTo - The type of the main value being decoded.
 *
 * @param item - The decoder for the value that may be present.
 * @param config - Configuration options for decoding optional values.
 * @returns A `FixedSizeDecoder` or `VariableSizeDecoder` for decoding option values.
 *
 * @example
 * Decoding an optional string with a size prefix.
 * ```ts
 * const stringCodec = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
 * const decoder = getOptionDecoder(stringCodec);
 *
 * decoder.decode(new Uint8Array([0x01, 0x02, 0x00, 0x00, 0x00, 0x48, 0x69]));
 * // some('Hi')
 *
 * decoder.decode(new Uint8Array([0x00]));
 * // none()
 * ```
 *
 * @see {@link getOptionCodec}
 */
export function getOptionDecoder<TTo, TSize extends number>(
    item: FixedSizeDecoder<TTo, TSize>,
    config: OptionCodecConfig<NumberDecoder> & { noneValue: 'zeroes'; prefix: null },
): FixedSizeDecoder<Option<TTo>, TSize>;
export function getOptionDecoder<TTo>(
    item: FixedSizeDecoder<TTo>,
    config: OptionCodecConfig<FixedSizeNumberDecoder> & { noneValue: 'zeroes' },
): FixedSizeDecoder<Option<TTo>>;
export function getOptionDecoder<TTo>(
    item: FixedSizeDecoder<TTo>,
    config: OptionCodecConfig<NumberDecoder> & { noneValue: 'zeroes' },
): VariableSizeDecoder<Option<TTo>>;
export function getOptionDecoder<TTo>(
    item: Decoder<TTo>,
    config?: OptionCodecConfig<NumberDecoder> & { noneValue?: ReadonlyUint8Array },
): VariableSizeDecoder<Option<TTo>>;
export function getOptionDecoder<TTo>(
    item: Decoder<TTo>,
    config: OptionCodecConfig<NumberDecoder> = {},
): Decoder<Option<TTo>> {
    const prefix = (() => {
        if (config.prefix === null) {
            return transformDecoder(getUnitDecoder(), () => false);
        }
        return getBooleanDecoder({ size: config.prefix ?? getU8Decoder() });
    })();
    const noneValue = (() => {
        if (config.noneValue === 'zeroes') {
            assertIsFixedSize(item);
            return fixDecoderSize(getUnitDecoder(), item.fixedSize);
        }
        if (!config.noneValue) {
            return getUnitDecoder();
        }
        return getConstantDecoder(config.noneValue);
    })();

    return getUnionDecoder(
        [
            transformDecoder(getTupleDecoder([prefix, noneValue]), () => none<TTo>()),
            transformDecoder(getTupleDecoder([prefix, item]), ([, value]) => some(value)),
        ],
        (bytes, offset) => {
            if (config.prefix === null && !config.noneValue) {
                return Number(offset < bytes.length);
            }
            if (config.prefix === null && config.noneValue != null) {
                const zeroValue =
                    config.noneValue === 'zeroes' ? new Uint8Array(noneValue.fixedSize).fill(0) : config.noneValue;
                return containsBytes(bytes, zeroValue, offset) ? 0 : 1;
            }
            return Number(prefix.read(bytes, offset)[0]);
        },
    );
}

/**
 * Returns a codec for encoding and decoding optional values using the {@link Option} type.
 *
 * This codec serializes and deserializes `Option<T>` values using a configurable approach:
 * - By default, a `u8` prefix is used (`0 = None`, `1 = Some`).
 * - If `noneValue: 'zeroes'` is set, `None` values are encoded/decoded as zeroes.
 * - If `noneValue` is a byte array, `None` values are represented by the provided constant.
 * - If `prefix: null` is set, the codec determines `None` values solely from `noneValue` or the presence of bytes.
 *
 * For more details on the configuration options, see {@link OptionCodecConfig}.
 *
 * Note that this behaves similarly to {@link getNullableCodec}, except it
 * encodes {@link OptionOrNullable} values and decodes {@link Option} values.
 *
 * @typeParam TFrom - The type of the main value being encoded.
 * @typeParam TTo - The type of the main value being decoded.
 *
 * @param item - The codec for the value that may be present.
 * @param config - Configuration options for encoding and decoding option values.
 * @returns A `FixedSizeCodec` or `VariableSizeCodec` for encoding and decoding option values.
 *
 * @example
 * Encoding and decoding an optional string with a size prefix.
 * ```ts
 * const stringCodec = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
 * const codec = getOptionCodec(stringCodec);
 *
 * const someBytes = codec.encode(some('Hi'));
 * // 0x01020000004869
 * //   | |       └-- utf8 string content ("Hi").
 * //   | └-- u32 string prefix (2 characters).
 * //   └-- 1-byte prefix (Some).
 *
 * const noneBytes = codec.encode(none());
 * // 0x00
 * //   └-- 1-byte prefix (None).
 *
 * codec.decode(someBytes); // some('Hi')
 * codec.decode(noneBytes); // none()
 * ```
 *
 * @example
 * Encoding nullable values.
 * ```ts
 * const stringCodec = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
 * const codec = getOptionCodec(stringCodec);
 *
 * const someBytes = codec.encode('Hi'); // 0x01020000004869
 * const noneBytes = codec.encode(null); // 0x00
 *
 * codec.decode(someBytes); // some('Hi')
 * codec.decode(noneBytes); // none()
 * ```
 *
 * @example
 * Encoding and decoding an optional number with a fixed size.
 * ```ts
 * const codec = getOptionCodec(getU16Codec(), { noneValue: 'zeroes' });
 *
 * const someBytes = codec.encode(some(42)); // 0x012a00
 * const noneBytes = codec.encode(none());   // 0x000000
 *
 * codec.decode(someBytes); // some(42)
 * codec.decode(noneBytes); // none()
 * ```
 *
 * @example
 * Encoding and decoding {@link None} values with a custom byte sequence and no prefix.
 * ```ts
 * const codec = getOptionCodec(getU16Codec(), {
 *   noneValue: new Uint8Array([0xff, 0xff]),
 *   prefix: null,
 * });
 *
 * const someBytes = codec.encode(some(42)); // 0x2a00
 * const noneBytes = codec.encode(none());   // 0xffff
 *
 * codec.decode(someBytes); // some(42)
 * codec.decode(noneBytes); // none()
 * ```
 *
 * @example
 * Identifying {@link None} values by the absence of bytes.
 * ```ts
 * const codec = getOptionCodec(getU16Codec(), { prefix: null });
 *
 * const someBytes = codec.encode(some(42)); // 0x2a00
 * const noneBytes = codec.encode(none());   // new Uint8Array(0)
 *
 * codec.decode(someBytes); // some(42)
 * codec.decode(noneBytes); // none()
 * ```
 *
 * @remarks
 * Separate {@link getOptionEncoder} and {@link getOptionDecoder} functions are available.
 *
 * ```ts
 * const bytes = getOptionEncoder(getU32Encoder()).encode(some(42));
 * const value = getOptionDecoder(getU32Decoder()).decode(bytes);
 * ```
 *
 * @see {@link getOptionEncoder}
 * @see {@link getOptionDecoder}
 */
export function getOptionCodec<TFrom, TTo extends TFrom, TSize extends number>(
    item: FixedSizeCodec<TFrom, TTo, TSize>,
    config: OptionCodecConfig<NumberCodec> & { noneValue: 'zeroes'; prefix: null },
): FixedSizeCodec<OptionOrNullable<TFrom>, Option<TTo>, TSize>;
export function getOptionCodec<TFrom, TTo extends TFrom = TFrom>(
    item: FixedSizeCodec<TFrom, TTo>,
    config: OptionCodecConfig<FixedSizeNumberCodec> & { noneValue: 'zeroes' },
): FixedSizeCodec<OptionOrNullable<TFrom>, Option<TTo>>;
export function getOptionCodec<TFrom, TTo extends TFrom = TFrom>(
    item: FixedSizeCodec<TFrom, TTo>,
    config: OptionCodecConfig<NumberCodec> & { noneValue: 'zeroes' },
): VariableSizeCodec<OptionOrNullable<TFrom>, Option<TTo>>;
export function getOptionCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config?: OptionCodecConfig<NumberCodec> & { noneValue?: ReadonlyUint8Array },
): VariableSizeCodec<OptionOrNullable<TFrom>, Option<TTo>>;
export function getOptionCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config: OptionCodecConfig<NumberCodec> = {},
): Codec<OptionOrNullable<TFrom>, Option<TTo>> {
    type ConfigCast = OptionCodecConfig<NumberCodec> & { noneValue?: ReadonlyUint8Array };
    return combineCodec(
        getOptionEncoder<TFrom>(item, config as ConfigCast),
        getOptionDecoder<TTo>(item, config as ConfigCast),
    );
}
