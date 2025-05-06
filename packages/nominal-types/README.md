[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/nominal-types?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/nominal-types?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/nominal-types

# @solana/nominal-types

This package contains type utilities for creating nominal types in TypeScript.

## Brands make otherwise equal values distinct at the type level

Use the `Brand` utility to produce a new type that satisfies the original type, but not the other way around. That is to say, the branded type is acceptable wherever the original type is specified, but wherever the branded type is specified, the original type will be insufficient.

You can use this to create specialized instances of strings, numbers, objects, and more which you would like to assert are special in some way (eg. numbers that are non-negative, strings which represent the names of foods, objects that have passed validation).

```ts
const unverifiedName = 'Alice';
const verifiedName = unverifiedName as Brand<'Alice', 'VerifiedName'>;

'Alice' satisfies Brand<string, 'VerifiedName'>; // ERROR
'Alice' satisfies Brand<'Alice', 'VerifiedName'>; // ERROR
unverifiedName satisfies Brand<string, 'VerifiedName'>; // ERROR
verifiedName satisfies Brand<'Bob', 'VerifiedName'>; // ERROR
verifiedName satisfies Brand<'Alice', 'VerifiedName'>; // OK
verifiedName satisfies Brand<string, 'VerifiedName'>; // OK
```

## Values can be tagged as compressed data

Use the `CompressedData` utility to produce a new type that satisfies the original type, but adds extra type information that marks the type as containing compressed data.

```ts
const untaggedData = new Uint8Array([/ ... *\/]);
const compressedData = untaggedData as CompressedData<typeof untaggedData, 'zstd'>;

compressedData satisfies CompressedData<Uint8Array, 'zstd'>; // OK
untaggedData satisfies CompressedData<Uint8Array, 'zstd'>; // ERROR
```

## Strings can be tagged as being encoded using a particular scheme

```ts
const untaggedString = 'dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92';
const encodedString = untaggedString as EncodedString<typeof untaggedString, 'base58'>;

encodedString satisfies EncodedString<'dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92', 'base58'>; // OK
encodedString satisfies EncodedString<string, 'base58'>; // OK
encodedString satisfies EncodedString<string, 'base64'>; // ERROR
untaggedString satisfies EncodedString<string, 'base58'>; // ERROR
```

## Brands, compression, and encodings can be combined

```ts
const encodedCompressedString = 'abc' as Brand<
    EncodedString<CompressedData<'abc', 'zstd'>, 'base64'>,
    'Base64ZstdCompressedData'
>;

encodedCompressedString satisfies Brand<'abc', 'Base64ZstdCompressedData'>; // OK
encodedCompressedString satisfies Brand<string, 'Base64ZstdCompressedData'>; // OK
encodedCompressedString satisfies CompressedData<'abc', 'zstd'>; // OK
encodedCompressedString satisfies CompressedData<string, 'zstd'>; // OK
encodedCompressedString satisfies EncodedString<'abc', 'base64'>; // OK
encodedCompressedString satisfies EncodedString<string, 'base64'>; // OK
encodedCompressedString satisfies EncodedString<string, 'base58'>; // ERROR
```

## Custom nominal types

```ts
type SweeteningSubstance = 'aspartame' | 'cane-sugar' | 'stevia';
type Sweetener<T extends SweeteningSubstance> = NominalType<'sweetener', T>;

// This function accepts sweetened foods, except those with aspartame.
declare function eat(food: string & Sweetener<Exclude<SweeteningSubstance, 'aspartame'>>): void;

const artificiallySweetenedDessert = 'ice-cream' as string & Sweetener<'aspartame'>;
eat(artificiallySweetenedDessert); // ERROR
```
