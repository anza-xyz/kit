/**
 * This package contains codecs for various data structures such as arrays, maps, structs, tuples, enums, etc.
 * It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * This package is also part of the [`@solana/codecs` package](https://github.com/anza-xyz/kit/tree/main/packages/codecs)
 * which acts as an entry point for all codec packages as well as for their documentation.
 *
 * @packageDocumentation
 */
export * from './array';
export * from './assertions';
export * from './bit-array';
export * from './boolean';
export * from './bytes';
export * from './constant';
export * from './discriminated-union';
export * from './enum';
export * from './hidden-prefix';
export * from './hidden-suffix';
export * from './literal-union';
export * from './map';
export * from './nullable';
export * from './set';
export * from './struct';
export * from './tuple';
export * from './union';
export * from './unit';
