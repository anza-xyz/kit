import { getBaseXCodec, getBaseXDecoder, getBaseXEncoder } from './baseX';

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Returns an encoder for base-58 strings.
 *
 * This encoder serializes strings using a base-58 encoding scheme,
 * commonly used in cryptocurrency addresses and other compact representations.
 *
 * For more details, see {@link getBase58Codec}.
 *
 * @returns A `VariableSizeEncoder<string>` for encoding base-58 strings.
 *
 * @example
 * Encoding a base-58 string.
 * ```ts
 * const encoder = getBase58Encoder();
 * const bytes = encoder.encode('heLLo'); // 0x1b6a3070
 * ```
 *
 * @see {@link getBase58Codec}
 */
export const getBase58Encoder = () => getBaseXEncoder(alphabet);

/**
 * Returns a decoder for base-58 strings.
 *
 * This decoder deserializes base-58 encoded strings from a byte array.
 *
 * For more details, see {@link getBase58Codec}.
 *
 * @returns A `VariableSizeDecoder<string>` for decoding base-58 strings.
 *
 * @example
 * Decoding a base-58 string.
 * ```ts
 * const decoder = getBase58Decoder();
 * const value = decoder.decode(new Uint8Array([0x1b, 0x6a, 0x30, 0x70])); // "heLLo"
 * ```
 *
 * @see {@link getBase58Codec}
 */
export const getBase58Decoder = () => getBaseXDecoder(alphabet);

/**
 * Returns a codec for encoding and decoding base-58 strings.
 *
 * This codec serializes strings using a base-58 encoding scheme,
 * commonly used in cryptocurrency addresses and other compact representations.
 *
 * @returns A `VariableSizeCodec<string>` for encoding and decoding base-58 strings.
 *
 * @example
 * Encoding and decoding a base-58 string.
 * ```ts
 * const codec = getBase58Codec();
 * const bytes = codec.encode('heLLo'); // 0x1b6a3070
 * const value = codec.decode(bytes);   // "heLLo"
 * ```
 *
 * @remarks
 * This codec does not enforce a size boundary. It will encode and decode all bytes necessary to represent the string.
 *
 * If you need a fixed-size base-58 codec, consider using {@link fixCodecSize}.
 *
 * ```ts
 * const codec = fixCodecSize(getBase58Codec(), 8);
 * ```
 *
 * If you need a size-prefixed base-58 codec, consider using {@link addCodecSizePrefix}.
 *
 * ```ts
 * const codec = addCodecSizePrefix(getBase58Codec(), getU32Codec());
 * ```
 *
 * Separate {@link getBase58Encoder} and {@link getBase58Decoder} functions are available.
 *
 * ```ts
 * const bytes = getBase58Encoder().encode('heLLo');
 * const value = getBase58Decoder().decode(bytes);
 * ```
 *
 * @see {@link getBase58Encoder}
 * @see {@link getBase58Decoder}
 */
export const getBase58Codec = () => getBaseXCodec(alphabet);
