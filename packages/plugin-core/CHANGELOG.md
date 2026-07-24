# @solana/plugin-core

## 8.0.0

## 7.0.0

### Major Changes

- [#1786](https://github.com/anza-xyz/kit/pull/1786) [`6947740`](https://github.com/anza-xyz/kit/commit/6947740680b1bb8c570a5c513ba165e356ceee7d) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Remove deprecated `getMinimumBalanceForRentExemption` and `createEmptyClient`.

    **BREAKING CHANGES**

    **Removed `getMinimumBalanceForRentExemption` from `@solana/kit`.** The minimum balance for an account is being actively reduced (see [SIMD-0437](https://github.com/solana-foundation/solana-improvement-documents/pull/437)) and is expected to become dynamic in future Solana upgrades (see [SIMD-0194](https://github.com/solana-foundation/solana-improvement-documents/pull/194) and [SIMD-0389](https://github.com/solana-foundation/solana-improvement-documents/pull/389)), so a hardcoded local computation can no longer return accurate results. Use the `getMinimumBalanceForRentExemption` RPC method or a `ClientWithGetMinimumBalance` plugin instead.

    ```diff
    - import { getMinimumBalanceForRentExemption } from '@solana/kit';
    - const rentExemptLamports = getMinimumBalanceForRentExemption(82n);
    + const { value: rentExemptLamports } = await rpc.getMinimumBalanceForRentExemption(82n).send();
    ```

    **Removed `createEmptyClient` from `@solana/plugin-core`.** Use `createClient`, which behaves identically and additionally accepts an optional initial value.

    ```diff
    - import { createEmptyClient } from '@solana/plugin-core';
    - const client = createEmptyClient();
    + import { createClient } from '@solana/plugin-core';
    + const client = createClient();
    ```

## 6.10.0

### Patch Changes

- [#1646](https://github.com/anza-xyz/kit/pull/1646) [`09e7796`](https://github.com/anza-xyz/kit/commit/09e779660a13899862fdf15a379d750be71e77d5) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Flatten the inferred return type of `extendClient` and `withCleanup` so that chained `.use()` calls on a `Client` no longer produce deeply nested `Omit<Omit<Omit<...>>>` types in editor tooltips and error messages. The inferred shape now displays as a single flat object literal at every step of the chain, while optional (`?`) and `readonly` modifiers, symbol keys, and override semantics are preserved exactly as before. Also exports the new `ExtendedClient<TClient, TAdditions>` helper type for plugin authors who write their own merging helpers and want the same flattening guarantee.

## 6.9.0

### Minor Changes

- [#1562](https://github.com/anza-xyz/kit/pull/1562) [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump the TypeScript peer dependency floor from `>=5.0.0` to `>=5.4.0`.

### Patch Changes

- [#1569](https://github.com/anza-xyz/kit/pull/1569) [`b1ae82b`](https://github.com/anza-xyz/kit/commit/b1ae82bbb2159f17a3e0f337c5f8677613b5b32d) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix `extendClient` so that a later plugin can override a key previously set by an earlier plugin. Previously, chaining two plugins that set the same key threw `TypeError: Cannot redefine property` because the frozen client's non-configurable property descriptors were copied verbatim onto the intermediate object.

## 6.8.0

### Patch Changes

- [#1532](https://github.com/anza-xyz/kit/pull/1532) [`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Update the TypeScript peer dependency from `^5.0.0` to `>=5.0.0` to allow TypeScript 6 and above.

## 6.7.0

### Minor Changes

- [#1509](https://github.com/anza-xyz/kit/pull/1509) [`2763d0c`](https://github.com/anza-xyz/kit/commit/2763d0c92b60089f4b20f6241cb5f91232cc2e75) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `createClient` function that replaces `createEmptyClient` and accepts an optional initial value. The old `createEmptyClient` is preserved as a deprecated re-export.

## 6.6.0

### Minor Changes

- [#1480](https://github.com/anza-xyz/kit/pull/1480) [`9c4fd6e`](https://github.com/anza-xyz/kit/commit/9c4fd6e67a6f70b1386f0745cf5afe0f93c75e36) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `withCleanup` function to `@solana/plugin-core`. Plugin authors can use it to register teardown logic (e.g. closing connections or clearing timers) on a client, making it `Disposable`. If the client already implements `Symbol.dispose`, the new cleanup function is chained so both run on disposal.

## 6.5.0

## 6.4.0

### Minor Changes

- [#1479](https://github.com/anza-xyz/kit/pull/1479) [`abeca1b`](https://github.com/anza-xyz/kit/commit/abeca1b28725f675128f68e4e73d2f655e500eaa) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `extendClient` helper for plugin authors to merge client objects while preserving property descriptors (getters, symbol-keyed properties, and non-enumerable properties).

    Plugin authors should migrate plugins to use this instead of spreading the input client.

    ```diff
    - return { ...client, rpc };
    + return extendClient(client, { rpc });
    ```

## 6.3.1

## 6.3.0

## 6.2.0

## 6.1.0

## 6.0.1

## 6.0.0

## 5.5.1

## 5.5.0

## 5.4.0

### Patch Changes

- [#1187](https://github.com/anza-xyz/kit/pull/1187) [`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Make Typescript peer dependency optional + reduce required version to ^5

## 5.3.0

## 5.2.0

### Minor Changes

- [#1113](https://github.com/anza-xyz/kit/pull/1113) [`b1937c7`](https://github.com/anza-xyz/kit/commit/b1937c7385050b911f50ac36913a6cfe4575036d) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add new `@solana/plugin-core` package enabling us to create modular Kit clients that can be extended with plugins.
