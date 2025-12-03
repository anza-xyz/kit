import {
    combineCodec,
    createDecoder,
    createEncoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    ReadonlyUint8Array,
} from '@solana/codecs-core';

/**
 * Returns an encoder for `void` values.
 *
 * This encoder writes nothing to the byte array and has a fixed size of 0 bytes.
 * It is useful when working with structures that require a no-op encoder,
 * such as empty variants in {@link getDiscriminatedUnionEncoder}.
 *
 * For more details, see {@link getUnitCodec}.
 *
 * @returns A `FixedSizeEncoder<void, 0>`, representing an empty encoder.
 *
 * @example
 * Encoding a `void` value.
 * ```ts
 * getUnitEncoder().encode(undefined); // Produces an empty byte array.
 * ```
 *
 * @see {@link getUnitCodec}
 */
export function getUnitEncoder(): FixedSizeEncoder<void, 0> {
    return createEncoder({
        fixedSize: 0,
        write: (_value, _bytes, offset) => offset,
    });
}

/**
 * Returns a decoder for `void` values.
 *
 * This decoder always returns `undefined` and has a fixed size of 0 bytes.
 * It is useful when working with structures that require a no-op decoder,
 * such as empty variants in {@link getDiscriminatedUnionDecoder}.
 *
 * For more details, see {@link getUnitCodec}.
 *
 * @returns A `FixedSizeDecoder<void, 0>`, representing an empty decoder.
 *
 * @example
 * Decoding a `void` value.
 * ```ts
 * getUnitDecoder().decode(anyBytes); // Returns `undefined`.
 * ```
 *
 * @see {@link getUnitCodec}
 */
export function getUnitDecoder(): FixedSizeDecoder<void, 0> {
    return createDecoder({
        fixedSize: 0,
        read: (_bytes: ReadonlyUint8Array | Uint8Array, offset) => [undefined, offset],
    });
}

/**
 * Returns a codec for `void` values.
 *
 * This codec does nothing when encoding or decoding and has a fixed size of 0 bytes.
 * Namely, it always returns `undefined` when decoding and produces an empty byte array when encoding.
 *
 * This can be useful when working with structures that require a no-op codec,
 * such as empty variants in {@link getDiscriminatedUnionCodec}.
 *
 * @returns A `FixedSizeCodec<void, void, 0>`, representing an empty codec.
 *
 * @example
 * Encoding and decoding a `void` value.
 * ```ts
 * const codec = getUnitCodec();
 *
 * codec.encode(undefined); // Produces an empty byte array.
 * codec.decode(new Uint8Array([])); // Returns `undefined`.
 * ```
 *
 * @example
 * Using unit codecs as empty variants in a discriminated union.
 * ```ts
 * type Message =
 *   | { __kind: 'Enter' }
 *   | { __kind: 'Leave' }
 *   | { __kind: 'Move'; x: number; y: number };
 *
 * const messageCodec = getDiscriminatedUnionCodec([
 *   ['Enter', getUnitCodec()], // <- No-op codec for empty data
 *   ['Leave', getUnitCodec()], // <- No-op codec for empty data
 *   ['Move', getStructCodec([...])]
 * ]);
 * ```
 *
 * @remarks
 * Separate {@link getUnitEncoder} and {@link getUnitDecoder} functions are available.
 *
 * ```ts
 * const bytes = getUnitEncoder().encode();
 * const value = getUnitDecoder().decode(bytes);
 * ```
 *
 * @see {@link getUnitEncoder}
 * @see {@link getUnitDecoder}
 */
export function getUnitCodec(): FixedSizeCodec<void, void, 0> {
    return combineCodec(getUnitEncoder(), getUnitDecoder());
}
