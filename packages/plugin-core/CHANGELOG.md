# @solana/plugin-core

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
