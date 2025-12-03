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
import {
    SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS,
    SOLANA_ERROR__CODECS__ENUM_DISCRIMINATOR_OUT_OF_RANGE,
    SOLANA_ERROR__CODECS__INVALID_ENUM_VARIANT,
    SolanaError,
} from '@solana/errors';

import {
    EnumLookupObject,
    formatNumericalValues,
    GetEnumFrom,
    getEnumIndexFromDiscriminator,
    getEnumIndexFromVariant,
    getEnumStats,
    GetEnumTo,
} from './enum-helpers';

/**
 * Defines the configuration options for enum codecs.
 *
 * The `size` option determines the numerical encoding used for the enum's discriminant.
 * By default, enums are stored as a `u8` (1 byte).
 *
 * The `useValuesAsDiscriminators` option allows mapping the actual enum values
 * as discriminators instead of using their positional index.
 *
 * @typeParam TDiscriminator - A number codec, encoder, or decoder used for the discriminant.
 */
export type EnumCodecConfig<TDiscriminator extends NumberCodec | NumberDecoder | NumberEncoder> = {
    /**
     * The codec used to encode/decode the enum discriminator.
     * @defaultValue `u8` discriminator.
     */
    size?: TDiscriminator;

    /**
     * If set to `true`, the enum values themselves will be used as discriminators.
     * This is only valid for numerical enum values.
     *
     * @defaultValue `false`
     */
    useValuesAsDiscriminators?: boolean;
};

/**
 * Returns an encoder for enums.
 *
 * This encoder serializes enums as a numerical discriminator.
 * By default, the discriminator is based on the positional index of the enum variants.
 *
 * For more details, see {@link getEnumCodec}.
 *
 * @typeParam TEnum - The TypeScript enum or object mapping enum keys to values.
 *
 * @param constructor - The constructor of the enum.
 * @param config - Configuration options for encoding the enum.
 * @returns A `FixedSizeEncoder` or `VariableSizeEncoder` for encoding enums.
 *
 * @example
 * Encoding enum values.
 * ```ts
 * enum Direction { Up,  Down, Left, Right }
 * const encoder = getEnumEncoder(Direction);
 *
 * encoder.encode(Direction.Up);    // 0x00
 * encoder.encode(Direction.Down);  // 0x01
 * encoder.encode(Direction.Left);  // 0x02
 * encoder.encode(Direction.Right); // 0x03
 * ```
 *
 * @see {@link getEnumCodec}
 */
export function getEnumEncoder<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config?: Omit<EnumCodecConfig<NumberEncoder>, 'size'>,
): FixedSizeEncoder<GetEnumFrom<TEnum>, 1>;
export function getEnumEncoder<TEnum extends EnumLookupObject, TSize extends number>(
    constructor: TEnum,
    config: EnumCodecConfig<NumberEncoder> & { size: FixedSizeNumberEncoder<TSize> },
): FixedSizeEncoder<GetEnumFrom<TEnum>, TSize>;
export function getEnumEncoder<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config?: EnumCodecConfig<NumberEncoder>,
): VariableSizeEncoder<GetEnumFrom<TEnum>>;
export function getEnumEncoder<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config: EnumCodecConfig<NumberEncoder> = {},
): Encoder<GetEnumFrom<TEnum>> {
    const prefix = config.size ?? getU8Encoder();
    const useValuesAsDiscriminators = config.useValuesAsDiscriminators ?? false;
    const { enumKeys, enumValues, numericalValues, stringValues } = getEnumStats(constructor);
    if (useValuesAsDiscriminators && enumValues.some(value => typeof value === 'string')) {
        throw new SolanaError(SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS, {
            stringValues: enumValues.filter((v): v is string => typeof v === 'string'),
        });
    }
    return transformEncoder(prefix, (variant: GetEnumFrom<TEnum>): number => {
        const index = getEnumIndexFromVariant({ enumKeys, enumValues, variant });
        if (index < 0) {
            throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_ENUM_VARIANT, {
                formattedNumericalValues: formatNumericalValues(numericalValues),
                numericalValues,
                stringValues,
                variant,
            });
        }
        return useValuesAsDiscriminators ? (enumValues[index] as number) : index;
    });
}

/**
 * Returns a decoder for enums.
 *
 * This decoder deserializes enums from a numerical discriminator.
 * By default, the discriminator is based on the positional index of the enum variants.
 *
 * For more details, see {@link getEnumCodec}.
 *
 * @typeParam TEnum - The TypeScript enum or object mapping enum keys to values.
 *
 * @param constructor - The constructor of the enum.
 * @param config - Configuration options for decoding the enum.
 * @returns A `FixedSizeDecoder` or `VariableSizeDecoder` for decoding enums.
 *
 * @example
 * Decoding enum values.
 * ```ts
 * enum Direction { Up,  Down, Left, Right }
 * const decoder = getEnumDecoder(Direction);
 *
 * decoder.decode(new Uint8Array([0x00])); // Direction.Up
 * decoder.decode(new Uint8Array([0x01])); // Direction.Down
 * decoder.decode(new Uint8Array([0x02])); // Direction.Left
 * decoder.decode(new Uint8Array([0x03])); // Direction.Right
 * ```
 *
 * @see {@link getEnumCodec}
 */
export function getEnumDecoder<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config?: Omit<EnumCodecConfig<NumberDecoder>, 'size'>,
): FixedSizeDecoder<GetEnumTo<TEnum>, 1>;
export function getEnumDecoder<TEnum extends EnumLookupObject, TSize extends number>(
    constructor: TEnum,
    config: EnumCodecConfig<NumberDecoder> & { size: FixedSizeNumberDecoder<TSize> },
): FixedSizeDecoder<GetEnumTo<TEnum>, TSize>;
export function getEnumDecoder<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config?: EnumCodecConfig<NumberDecoder>,
): VariableSizeDecoder<GetEnumTo<TEnum>>;
export function getEnumDecoder<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config: EnumCodecConfig<NumberDecoder> = {},
): Decoder<GetEnumTo<TEnum>> {
    const prefix = config.size ?? getU8Decoder();
    const useValuesAsDiscriminators = config.useValuesAsDiscriminators ?? false;
    const { enumKeys, enumValues, numericalValues } = getEnumStats(constructor);
    if (useValuesAsDiscriminators && enumValues.some(value => typeof value === 'string')) {
        throw new SolanaError(SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS, {
            stringValues: enumValues.filter((v): v is string => typeof v === 'string'),
        });
    }
    return transformDecoder(prefix, (value: bigint | number): GetEnumTo<TEnum> => {
        const discriminator = Number(value);
        const index = getEnumIndexFromDiscriminator({
            discriminator,
            enumKeys,
            enumValues,
            useValuesAsDiscriminators,
        });
        if (index < 0) {
            const validDiscriminators = useValuesAsDiscriminators
                ? numericalValues
                : [...Array(enumKeys.length).keys()];
            throw new SolanaError(SOLANA_ERROR__CODECS__ENUM_DISCRIMINATOR_OUT_OF_RANGE, {
                discriminator,
                formattedValidDiscriminators: formatNumericalValues(validDiscriminators),
                validDiscriminators,
            });
        }
        return enumValues[index] as GetEnumTo<TEnum>;
    });
}

/**
 * Returns a codec for encoding and decoding enums.
 *
 * This codec serializes enums as a numerical discriminator, allowing them
 * to be efficiently stored and reconstructed from binary data.
 *
 * By default, the discriminator is derived from the positional index
 * of the enum variant, but it can be configured to use the enum's numeric values instead.
 *
 * @typeParam TEnum - The TypeScript enum or object mapping enum keys to values.
 *
 * @param constructor - The constructor of the enum.
 * @param config - Configuration options for encoding and decoding the enum.
 * @returns A `FixedSizeCodec` or `VariableSizeCodec` for encoding and decoding enums.
 *
 * @example
 * Encoding and decoding enums using positional indexes.
 * ```ts
 * enum Direction { Up, Down, Left, Right }
 * const codec = getEnumCodec(Direction);
 *
 * codec.encode(Direction.Up);    // 0x00
 * codec.encode(Direction.Down);  // 0x01
 * codec.encode(Direction.Left);  // 0x02
 * codec.encode(Direction.Right); // 0x03
 *
 * codec.decode(new Uint8Array([0x00])); // Direction.Up
 * codec.decode(new Uint8Array([0x01])); // Direction.Down
 * codec.decode(new Uint8Array([0x02])); // Direction.Left
 * codec.decode(new Uint8Array([0x03])); // Direction.Right
 * ```
 *
 * @example
 * Encoding and decoding enums using their numeric values.
 * ```ts
 * enum GameDifficulty { Easy = 1, Normal = 4, Hard = 7, Expert = 9 }
 * const codec = getEnumCodec(GameDifficulty, { useValuesAsDiscriminators: true });
 *
 * codec.encode(GameDifficulty.Easy);   // 0x01
 * codec.encode(GameDifficulty.Normal); // 0x04
 * codec.encode(GameDifficulty.Hard);   // 0x07
 * codec.encode(GameDifficulty.Expert); // 0x09
 *
 * codec.decode(new Uint8Array([0x01])); // GameDifficulty.Easy
 * codec.decode(new Uint8Array([0x04])); // GameDifficulty.Normal
 * codec.decode(new Uint8Array([0x07])); // GameDifficulty.Hard
 * codec.decode(new Uint8Array([0x09])); // GameDifficulty.Expert
 * ```
 *
 * Note that, when using values as discriminators, the enum values must be numerical.
 * Otherwise, an error will be thrown.
 *
 * ```ts
 * enum GameDifficulty { Easy = 'EASY', Normal = 'NORMAL', Hard = 'HARD' }
 * getEnumCodec(GameDifficulty, { useValuesAsDiscriminators: true }); // Throws an error.
 * ```
 *
 * @example
 * Using a custom discriminator size.
 * ```ts
 * enum Status { Pending, Approved, Rejected }
 * const codec = getEnumCodec(Status, { size: getU16Codec() });
 *
 * codec.encode(Status.Pending);  // 0x0000
 * codec.encode(Status.Approved); // 0x0100
 * codec.encode(Status.Rejected); // 0x0200
 *
 * codec.decode(new Uint8Array([0x00, 0x00])); // Status.Pending
 * codec.decode(new Uint8Array([0x01, 0x00])); // Status.Approved
 * codec.decode(new Uint8Array([0x02, 0x00])); // Status.Rejected
 * ```
 *
 * @remarks
 * Separate {@link getEnumEncoder} and {@link getEnumDecoder} functions are available.
 *
 * ```ts
 * const bytes = getEnumEncoder(Direction).encode(Direction.Up);
 * const value = getEnumDecoder(Direction).decode(bytes);
 * ```
 *
 * @see {@link getEnumEncoder}
 * @see {@link getEnumDecoder}
 */
export function getEnumCodec<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config?: Omit<EnumCodecConfig<NumberCodec>, 'size'>,
): FixedSizeCodec<GetEnumFrom<TEnum>, GetEnumTo<TEnum>, 1>;
export function getEnumCodec<TEnum extends EnumLookupObject, TSize extends number>(
    constructor: TEnum,
    config: EnumCodecConfig<NumberCodec> & { size: FixedSizeNumberCodec<TSize> },
): FixedSizeCodec<GetEnumFrom<TEnum>, GetEnumTo<TEnum>, TSize>;
export function getEnumCodec<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config?: EnumCodecConfig<NumberCodec>,
): VariableSizeCodec<GetEnumFrom<TEnum>, GetEnumTo<TEnum>>;
export function getEnumCodec<TEnum extends EnumLookupObject>(
    constructor: TEnum,
    config: EnumCodecConfig<NumberCodec> = {},
): Codec<GetEnumFrom<TEnum>, GetEnumTo<TEnum>> {
    return combineCodec(getEnumEncoder(constructor, config), getEnumDecoder(constructor, config));
}
