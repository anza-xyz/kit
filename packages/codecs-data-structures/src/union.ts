/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Codec,
    combineCodec,
    createDecoder,
    createEncoder,
    Decoder,
    Encoder,
    getEncodedSize,
    isFixedSize,
    Offset,
    ReadonlyUint8Array,
} from '@solana/codecs-core';
import { SOLANA_ERROR__CODECS__UNION_VARIANT_OUT_OF_RANGE, SolanaError } from '@solana/errors';

import {
    GetDecoderTypeFromVariants,
    GetEncoderTypeFromVariants,
    getMaxSize,
    GetUnionCodecType,
    GetUnionDecoderType,
    GetUnionEncoderType,
    maxCodecSizes,
} from './utils';

/**
 * Returns an encoder for union types.
 *
 * This encoder serializes values by selecting the correct variant encoder
 * based on the `getIndexFromValue` function.
 *
 * Unlike other codecs, this encoder does not store the variant index.
 * It is the user's responsibility to manage discriminators separately.
 *
 * For more details, see {@link getUnionCodec}.
 *
 * @typeParam TVariants - An array of encoders, each corresponding to a union variant.
 *
 * @param variants - The encoders for each variant of the union.
 * @param getIndexFromValue - A function that determines the variant index from the provided value.
 * @returns An `Encoder` for encoding union values.
 *
 * @example
 * Encoding a union of numbers and booleans.
 * ```ts
 * const encoder = getUnionEncoder(
 *   [getU16Encoder(), getBooleanEncoder()],
 *   value => (typeof value === 'number' ? 0 : 1)
 * );
 *
 * encoder.encode(42);
 * // 0x2a00
 * //   └── Encoded number (42) as `u16`
 *
 * encoder.encode(true);
 * // 0x01
 * //   └── Encoded boolean (`true`) as `u8`
 * ```
 *
 * @see {@link getUnionCodec}
 */
export function getUnionEncoder<const TVariants extends readonly Encoder<any>[]>(
    variants: TVariants,
    getIndexFromValue: (value: GetEncoderTypeFromVariants<TVariants>) => number,
): GetUnionEncoderType<TVariants> {
    type TFrom = GetEncoderTypeFromVariants<TVariants>;
    const fixedSize = getUnionFixedSize(variants);
    const write: Encoder<TFrom>['write'] = (variant, bytes, offset) => {
        const index = getIndexFromValue(variant);
        assertValidVariantIndex(variants, index);
        return variants[index].write(variant, bytes, offset);
    };

    if (fixedSize !== null) {
        return createEncoder({ fixedSize, write }) as GetUnionEncoderType<TVariants>;
    }

    const maxSize = getUnionMaxSize(variants);
    return createEncoder({
        ...(maxSize !== null ? { maxSize } : {}),
        getSizeFromValue: variant => {
            const index = getIndexFromValue(variant);
            assertValidVariantIndex(variants, index);
            return getEncodedSize(variant, variants[index]);
        },
        write,
    }) as GetUnionEncoderType<TVariants>;
}

/**
 * Returns a decoder for union types.
 *
 * This decoder deserializes values by selecting the correct variant decoder
 * based on the `getIndexFromBytes` function.
 *
 * Unlike other codecs, this decoder does not assume a stored discriminator.
 * It is the user's responsibility to manage discriminators separately.
 *
 * For more details, see {@link getUnionCodec}.
 *
 * @typeParam TVariants - An array of decoders, each corresponding to a union variant.
 *
 * @param variants - The decoders for each variant of the union.
 * @param getIndexFromBytes - A function that determines the variant index from the byte array.
 * @returns A `Decoder` for decoding union values.
 *
 * @example
 * Decoding a union of numbers and booleans.
 * ```ts
 * const decoder = getUnionDecoder(
 *   [getU16Decoder(), getBooleanDecoder()],
 *   (bytes, offset) => (bytes.length - offset > 1 ? 0 : 1)
 * );
 *
 * decoder.decode(new Uint8Array([0x2a, 0x00])); // 42
 * decoder.decode(new Uint8Array([0x01]));       // true
 * // Type is inferred as `number | boolean`
 * ```
 *
 * @see {@link getUnionCodec}
 */
export function getUnionDecoder<const TVariants extends readonly Decoder<any>[]>(
    variants: TVariants,
    getIndexFromBytes: (bytes: ReadonlyUint8Array, offset: Offset) => number,
): GetUnionDecoderType<TVariants> {
    type TTo = GetDecoderTypeFromVariants<TVariants>;
    const fixedSize = getUnionFixedSize(variants);
    const read: Decoder<TTo>['read'] = (bytes, offset) => {
        const index = getIndexFromBytes(bytes, offset);
        assertValidVariantIndex(variants, index);
        return variants[index].read(bytes, offset);
    };

    if (fixedSize !== null) {
        return createDecoder({ fixedSize, read }) as GetUnionDecoderType<TVariants>;
    }

    const maxSize = getUnionMaxSize(variants);
    return createDecoder({ ...(maxSize !== null ? { maxSize } : {}), read }) as GetUnionDecoderType<TVariants>;
}

/**
 * Returns a codec for encoding and decoding union types.
 *
 * This codec serializes and deserializes union values by selecting the correct variant
 * based on the provided index functions.
 *
 * Unlike the {@link getDiscriminatedUnionCodec}, this codec does not assume a stored
 * discriminator and must be used with an explicit mechanism for managing discriminators.
 *
 * @typeParam TVariants - An array of codecs, each corresponding to a union variant.
 *
 * @param variants - The codecs for each variant of the union.
 * @param getIndexFromValue - A function that determines the variant index from the provided value.
 * @param getIndexFromBytes - A function that determines the variant index from the byte array.
 * @returns A `Codec` for encoding and decoding union values.
 *
 * @example
 * Encoding and decoding a union of numbers and booleans.
 * ```ts
 * const codec = getUnionCodec(
 *   [getU16Codec(), getBooleanCodec()],
 *   value => (typeof value === 'number' ? 0 : 1),
 *   (bytes, offset) => (bytes.length - offset > 1 ? 0 : 1)
 * );
 *
 * const bytes1 = codec.encode(42); // 0x2a00
 * const value1: number | boolean = codec.decode(bytes1); // 42
 *
 * const bytes2 = codec.encode(true); // 0x01
 * const value2: number | boolean = codec.decode(bytes2); // true
 * ```
 *
 * @remarks
 * If you need a codec that includes a stored discriminator,
 * consider using {@link getDiscriminatedUnionCodec}.
 *
 * Separate {@link getUnionEncoder} and {@link getUnionDecoder} functions are also available.
 *
 * ```ts
 * const bytes = getUnionEncoder(variantEncoders, getIndexFromValue).encode(42);
 * const value = getUnionDecoder(variantDecoders, getIndexFromBytes).decode(bytes);
 * ```
 *
 * @see {@link getUnionEncoder}
 * @see {@link getUnionDecoder}
 * @see {@link getDiscriminatedUnionCodec}
 */
export function getUnionCodec<const TVariants extends readonly Codec<any>[]>(
    variants: TVariants,
    getIndexFromValue: (value: GetEncoderTypeFromVariants<TVariants>) => number,
    getIndexFromBytes: (bytes: ReadonlyUint8Array, offset: Offset) => number,
): GetUnionCodecType<TVariants> {
    return combineCodec(
        getUnionEncoder(variants, getIndexFromValue),
        getUnionDecoder(variants as readonly Decoder<any>[], getIndexFromBytes) as Decoder<
            GetDecoderTypeFromVariants<TVariants> & GetEncoderTypeFromVariants<TVariants>
        >,
    ) as GetUnionCodecType<TVariants>;
}

function assertValidVariantIndex(variants: readonly unknown[], index: number) {
    if (typeof variants[index] === 'undefined') {
        throw new SolanaError(SOLANA_ERROR__CODECS__UNION_VARIANT_OUT_OF_RANGE, {
            maxRange: variants.length - 1,
            minRange: 0,
            variant: index,
        });
    }
}

function getUnionFixedSize<const TVariants extends readonly (Decoder<any> | Encoder<any>)[]>(variants: TVariants) {
    if (variants.length === 0) return 0;
    if (!isFixedSize(variants[0])) return null;
    const variantSize = variants[0].fixedSize;
    const sameSizedVariants = variants.every(variant => isFixedSize(variant) && variant.fixedSize === variantSize);
    return sameSizedVariants ? variantSize : null;
}

function getUnionMaxSize<const TVariants extends readonly (Decoder<any> | Encoder<any>)[]>(variants: TVariants) {
    return maxCodecSizes(variants.map(variant => getMaxSize(variant)));
}
