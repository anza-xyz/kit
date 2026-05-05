# @solana/fixed-points

## 6.9.0

### Minor Changes

- [#1570](https://github.com/anza-xyz/kit/pull/1570) [`c5e0e14`](https://github.com/anza-xyz/kit/commit/c5e0e1444ae420390047d5e37a13650edf042954) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add a new `@solana/fixed-points` package providing precise fixed-point number types for Solana, both decimal (power-of-10 scale) and binary (power-of-2 scale), in signed and unsigned flavors with arbitrary bit widths. The package includes factories, guards, arithmetic, comparisons, signedness conversions, rescaling, string/number formatting, and byte-level codecs. Also re-exported from `@solana/codecs` and `@solana/kit`.

- [#1562](https://github.com/anza-xyz/kit/pull/1562) [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump the TypeScript peer dependency floor from `>=5.0.0` to `>=5.4.0`.

### Patch Changes

- Updated dependencies [[`92126f4`](https://github.com/anza-xyz/kit/commit/92126f438afff8b7521f827cf0e92b1d2cd69c55), [`a5ef97b`](https://github.com/anza-xyz/kit/commit/a5ef97b17fe747de1e2bee0189ed44e20c0f6c40), [`e82e03e`](https://github.com/anza-xyz/kit/commit/e82e03eb0e982db74f96d11b9aa8fefb4f0038c3), [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7)]:
    - @solana/errors@6.9.0
    - @solana/codecs-core@6.9.0
