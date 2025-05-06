/**
 * This package contains type utilities for creating nominal types in TypeScript.
 *
 * @example Brands, compression, and encodings can be combined
 * ```ts
 * const encodedCompressedString = 'abc' as Brand<
 *     EncodedString<CompressedData<'abc', 'zstd'>, 'base64'>,
 *     'Base64ZstdCompressedData'
 * >;
 *
 * encodedCompressedString satisfies Brand<'abc', 'Base64ZstdCompressedData'>; // OK
 * encodedCompressedString satisfies Brand<string, 'Base64ZstdCompressedData'>; // OK
 * encodedCompressedString satisfies CompressedData<'abc', 'zstd'>; // OK
 * encodedCompressedString satisfies CompressedData<string, 'zstd'>; // OK
 * encodedCompressedString satisfies EncodedString<'abc', 'base64'>; // OK
 * encodedCompressedString satisfies EncodedString<string, 'base64'>; // OK
 * encodedCompressedString satisfies EncodedString<string, 'base58'>; // ERROR
 * ```
 *
 * @packageDocumentation
 */

type CompressionFormat = 'zstd';
type StringEncoding = 'base58' | 'base64';

/**
 * Use this to produce a new type that satisfies the original type, but not the other way around.
 * That is to say, the branded type is acceptable wherever the original type is specified, but
 * wherever the branded type is specified, the original type will be insufficient.
 *
 * You can use this to create specialized instances of strings, numbers, objects, and more which
 * you would like to assert are special in some way (eg. numbers that are non-negative, strings
 * which represent the names of foods, objects that have passed validation).
 *
 * @typeParam T - The base type to brand
 * @typeParam TBrandName - A string that identifies a particular brand. Branded types with identical
 * names will satisfy each other so long as their base types satisfy each other. Branded types with
 * different names will never satisfy each other.
 *
 * @example
 * ```ts
 * const unverifiedName = 'Alice';
 * const verifiedName = unverifiedName as Brand<'Alice', 'VerifiedName'>;
 *
 * 'Alice' satisfies Brand<string, 'VerifiedName'>; // ERROR
 * 'Alice' satisfies Brand<'Alice', 'VerifiedName'>; // ERROR
 * unverifiedName satisfies Brand<string, 'VerifiedName'>; // ERROR
 * verifiedName satisfies Brand<'Bob', 'VerifiedName'>; // ERROR
 * verifiedName satisfies Brand<'Alice', 'VerifiedName'>; // OK
 * verifiedName satisfies Brand<string, 'VerifiedName'>; // OK
 * ```
 */
export type Brand<T, TBrandName extends string> = NominalType<'brand', TBrandName> & T;

/**
 * Use this to produce a new type that satisfies the original type, but adds extra type information
 * that marks the type as containing compressed data.
 *
 * @typeParam T - The base type to mark as representing compressed data
 * @typeParam TFormat - The compression format of the underlying data
 *
 * @example
 * ```ts
 * const untaggedData = new Uint8Array([/* ... *\/]);
 * const compressedData = untaggedData as CompressedData<typeof untaggedData, 'zstd'>;
 *
 * compressedData satisfies CompressedData<Uint8Array, 'zstd'>; // OK
 * untaggedData satisfies CompressedData<Uint8Array, 'zstd'>; // ERROR
 * ```
 */
export type CompressedData<T, TFormat extends CompressionFormat> = NominalType<'compressionFormat', TFormat> & T;

/**
 * Use this to produce a new type that satisfies the original string type, but adds extra type
 * information that marks the string as being encoded in a particular format.
 *
 * @typeParam T - The underlying string type
 * @typeParam TEncoding - The encoding format of the string
 *
 * @example
 * ```ts
 * const untaggedString = 'dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92';
 * const encodedString = untaggedString as EncodedString<typeof untaggedString, 'base58'>;
 *
 * encodedString satisfies EncodedString<'dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92', 'base58'>; // OK
 * encodedString satisfies EncodedString<string, 'base58'>; // OK
 * encodedString satisfies EncodedString<string, 'base64'>; // ERROR
 * untaggedString satisfies EncodedString<string, 'base58'>; // ERROR
 * ```
 */
export type EncodedString<T extends string, TEncoding extends StringEncoding> = NominalType<
    'stringEncoding',
    TEncoding
> &
    T;

/**
 * Use this to produce a nominal type.
 *
 * This can be intersected with other base types to produce custom branded types.
 *
 * @typeParam TKey - The name of the nominal type. This distinguishes one nominal type from another.
 * @typeParam TMarker - The type of the value the nominal type can take.
 *
 * @example
 * ```ts
 * type SweeteningSubstance = 'aspartame' | 'cane-sugar' | 'stevia';
 * type Sweetener<T extends SweeteningSubstance> = NominalType<'sweetener', T>;
 *
 * // This function accepts sweetened foods, except those with aspartame.
 * declare function eat(food: string & Sweetener<Exclude<SweeteningSubstance, 'aspartame'>>): void;
 *
 * const artificiallySweetenedDessert = 'ice-cream' as string & Sweetener<'aspartame'>;
 * eat(artificiallySweetenedDessert); // ERROR
 * ```
 */
export type NominalType<TKey extends string, TMarker extends string> = {
    readonly [K in `__${TKey}:@solana/kit`]: TMarker;
};
