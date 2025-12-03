import { getBaseXCodec, getBaseXDecoder, getBaseXEncoder } from './baseX';

const alphabet = '0123456789';

/**
 * Returns an encoder for base-10 strings.
 *
 * This encoder serializes strings using a base-10 encoding scheme.
 * The output consists of bytes representing the numerical values of the input string.
 *
 * For more details, see {@link getBase10Codec}.
 *
 * @returns A `VariableSizeEncoder<string>` for encoding base-10 strings.
 *
 * @example
 * Encoding a base-10 string.
 * ```ts
 * const encoder = getBase10Encoder();
 * const bytes = encoder.encode('1024'); // 0x0400
 * ```
 *
 * @see {@link getBase10Codec}
 */
export const getBase10Encoder = () => getBaseXEncoder(alphabet);

/**
 * Returns a decoder for base-10 strings.
 *
 * This decoder deserializes base-10 encoded strings from a byte array.
 *
 * For more details, see {@link getBase10Codec}.
 *
 * @returns A `VariableSizeDecoder<string>` for decoding base-10 strings.
 *
 * @example
 * Decoding a base-10 string.
 * ```ts
 * const decoder = getBase10Decoder();
 * const value = decoder.decode(new Uint8Array([0x04, 0x00])); // "1024"
 * ```
 *
 * @see {@link getBase10Codec}
 */
export const getBase10Decoder = () => getBaseXDecoder(alphabet);

/**
 * Returns a codec for encoding and decoding base-10 strings.
 *
 * This codec serializes strings using a base-10 encoding scheme.
 * The output consists of bytes representing the numerical values of the input string.
 *
 * @returns A `VariableSizeCodec<string>` for encoding and decoding base-10 strings.
 *
 * @example
 * Encoding and decoding a base-10 string.
 * ```ts
 * const codec = getBase10Codec();
 * const bytes = codec.encode('1024'); // 0x0400
 * const value = codec.decode(bytes);  // "1024"
 * ```
 *
 * @remarks
 * This codec does not enforce a size boundary. It will encode and decode all bytes necessary to represent the string.
 *
 * If you need a fixed-size base-10 codec, consider using {@link fixCodecSize}.
 *
 * ```ts
 * const codec = fixCodecSize(getBase10Codec(), 5);
 * ```
 *
 * If you need a size-prefixed base-10 codec, consider using {@link addCodecSizePrefix}.
 *
 * ```ts
 * const codec = addCodecSizePrefix(getBase10Codec(), getU32Codec());
 * ```
 *
 * Separate {@link getBase10Encoder} and {@link getBase10Decoder} functions are available.
 *
 * ```ts
 * const bytes = getBase10Encoder().encode('1024');
 * const value = getBase10Decoder().decode(bytes);
 * ```
 *
 * @see {@link getBase10Encoder}
 * @see {@link getBase10Decoder}
 */
export const getBase10Codec = () => getBaseXCodec(alphabet);
