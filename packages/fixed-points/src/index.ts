/**
 * This package provides fixed-point number types — both decimal (scale is a
 * power of 10) and binary (scale is a power of 2) — in signed and unsigned
 * flavors with arbitrary bit widths. It can be used standalone, but it is also
 * exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * This package is also part of the [`@solana/codecs` package](https://github.com/anza-xyz/kit/tree/main/packages/codecs)
 * which acts as an entry point for all codec packages as well as for their documentation.
 *
 * @packageDocumentation
 */
export * from './binary';
export type { FixedPointCodecConfig } from './codecs';
export * from './decimal';
export type { FixedPointToStringOptions } from './formatting';
export type { RoundingMode } from './rounding';
export * from './signedness';
