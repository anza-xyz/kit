# @solana/subscribable

## 2.2.1

### Patch Changes

- Updated dependencies []:
    - @solana/errors@2.2.1

## 2.2.0

### Patch Changes

- Updated dependencies []:
    - @solana/errors@2.2.0

## 2.1.1

### Patch Changes

- [#473](https://github.com/anza-xyz/kit/pull/473) [`36a9dee`](https://github.com/anza-xyz/kit/commit/36a9dee4e6cbd72020dc74777fe394130b9a5f46) Thanks [@steveluscher](https://github.com/steveluscher)! - The identity of all branded types has changed in such a way that the types from v2.1.1 will be compatible with any other version going forward, which is not the case for versions v2.1.0 and before.

    If you end up with a mix of versions in your project prior to v2.1.1 (eg. `@solana/addresses@2.0.0` and `@solana/addresses@2.1.0`) you may discover that branded types like `Address` raise a type error, even though they are runtime compatible. Your options are:

    1. Always make sure that you have exactly one instance of each `@solana/*` dependency in your project at any given time
    2. Upgrade all of your `@solana/*` dependencies to v2.1.1 at minimum, even if their minor or patch versions differ.
    3. Suppress the type errors using a comment like the following:
        ```ts
        const myAddress = address('1234..5678'); // from @solana/addresses@2.0.0
        const myAccount = await fetchEncodedAccount(
            // imports @solana/addresses@2.1.0
            rpc,
            // @ts-expect-error Address types mismatch between installed versions of @solana/addresses
            myAddress,
        );
        ```

- [#236](https://github.com/anza-xyz/kit/pull/236) [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2) Thanks [@steveluscher](https://github.com/steveluscher)! - The minimum TypeScript version is now 5.3.3

- Updated dependencies [[`36a9dee`](https://github.com/anza-xyz/kit/commit/36a9dee4e6cbd72020dc74777fe394130b9a5f46), [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2)]:
    - @solana/errors@2.1.1

## 2.1.0

### Patch Changes

- [`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d) Thanks [@leantOnSol](https://github.com/leantOnSol)! - A two-versions-old version of Node LTS is now specified everywhere via the `engines` field, including the one in the root of the `pnpm` workspace, and engine-strictness is delegated to the `.npmrc` files.

- [`29d1e28`](https://github.com/anza-xyz/kit/commit/29d1e282f7ae53db008515980f13d54c40760065) Thanks [@steveluscher](https://github.com/steveluscher)! - Disabled the `MaxListenersExceededWarning` in Node when creating event targets for internal use

- Updated dependencies [[`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d), [`c7b7dd9`](https://github.com/anza-xyz/kit/commit/c7b7dd99aca878d2450760c214dbea593ddbadc0), [`5af7f20`](https://github.com/anza-xyz/kit/commit/5af7f2013135a79893a0f190a905c6dd077ac38c), [`704d8a2`](https://github.com/anza-xyz/kit/commit/704d8a220592a5a472bd7726013814b50c991f5b)]:
    - @solana/errors@2.1.0

## 2.0.0

### Patch Changes

- [#3541](https://github.com/solana-labs/solana-web3.js/pull/3541) [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Drop the Release Candidate label and publish `@solana/web3.js` at version 2.0.0

- [#3301](https://github.com/solana-labs/solana-web3.js/pull/3301) [`8c2cb9f`](https://github.com/solana-labs/solana-web3.js/commit/8c2cb9f44a52b3c27bc15c2c972bea1aae1622e7) Thanks [@steveluscher](https://github.com/steveluscher)! - Creates a package for working with subscribable data sources like event targets. From an `EventTarget` or object which conforms to the `EventEmitter` interface you can now create a more ergonomic `DataPublisher` (object with an `on` method that vends an unsubscribe function) or an abortable `AsyncIterable`.

- Updated dependencies [[`9370133`](https://github.com/solana-labs/solana-web3.js/commit/9370133e414bfa863517248d97905449e9a867eb), [`89f399d`](https://github.com/solana-labs/solana-web3.js/commit/89f399d474abac463b1daaa864c88305d7b8c21f), [`ebb03cd`](https://github.com/solana-labs/solana-web3.js/commit/ebb03cd8270027db957d4cecc7d2374d468d4ccb), [`ce1be3f`](https://github.com/solana-labs/solana-web3.js/commit/ce1be3fe37ea9b744fd836f3d6c2c8e5e31efd77), [`82cf07f`](https://github.com/solana-labs/solana-web3.js/commit/82cf07f4e905f6b056e70a0463a94222c3e7cadd), [`2d54650`](https://github.com/solana-labs/solana-web3.js/commit/2d5465018d8060eceb00efbf4f718df26d145199), [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4), [`bef9604`](https://github.com/solana-labs/solana-web3.js/commit/bef960435eb2303395bfa76e44f84d3348c5722d), [`7e86583`](https://github.com/solana-labs/solana-web3.js/commit/7e86583da68695076ec62033f3fe078b3890f026), [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df), [`677a9c4`](https://github.com/solana-labs/solana-web3.js/commit/677a9c4eb88a8ac6a9ede8d82f367c5ac8d69ff4), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090), [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418), [`288029a`](https://github.com/solana-labs/solana-web3.js/commit/288029a55a5eeb863b6df960027a59214ffc37f1), [`4ae78f5`](https://github.com/solana-labs/solana-web3.js/commit/4ae78f5cdddd6772b25351beb813483d4e52cea6), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a)]:
    - @solana/errors@2.0.0

## 2.0.0-rc.4

### Patch Changes

- Updated dependencies [[`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090)]:
    - @solana/errors@2.0.0-rc.4

## 2.0.0-rc.3

### Patch Changes

- Updated dependencies []:
    - @solana/errors@2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- [#3301](https://github.com/solana-labs/solana-web3.js/pull/3301) [`8c2cb9f`](https://github.com/solana-labs/solana-web3.js/commit/8c2cb9f44a52b3c27bc15c2c972bea1aae1622e7) Thanks [@steveluscher](https://github.com/steveluscher)! - Creates a package for working with subscribable data sources like event targets. From an `EventTarget` or object which conforms to the `EventEmitter` interface you can now create a more ergonomic `DataPublisher` (object with an `on` method that vends an unsubscribe function) or an abortable `AsyncIterable`.

- Updated dependencies [[`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a)]:
    - @solana/errors@2.0.0-rc.2
