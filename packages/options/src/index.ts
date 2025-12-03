/**
 * This package allows us to manage and serialize Rust-like Option types in JavaScript.
 * It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * This package is also part of the [`@solana/codecs` package](https://github.com/anza-xyz/kit/tree/main/packages/codecs)
 * which acts as an entry point for all codec packages as well as for their documentation.
 *
 * @packageDocumentation
 */
export * from './option';
export * from './option-codec';
export * from './unwrap-option';
export * from './unwrap-option-recursively';
