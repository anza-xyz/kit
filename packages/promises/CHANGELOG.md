# @solana/promises

## 3.0.0

## 2.3.0

## 2.2.1

## 2.2.0

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

## 2.1.0

## 2.0.0

### Patch Changes

- [#3541](https://github.com/solana-labs/solana-web3.js/pull/3541) [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Drop the Release Candidate label and publish `@solana/web3.js` at version 2.0.0

- [#3071](https://github.com/solana-labs/solana-web3.js/pull/3071) [`b4bf318`](https://github.com/solana-labs/solana-web3.js/commit/b4bf318d7d4bdd639e4c126c70350993a8540fe8) Thanks [@steveluscher](https://github.com/steveluscher)! - Created a helper that you can use to race two or more promises without having to worry about them leaking memory

- [#3070](https://github.com/solana-labs/solana-web3.js/pull/3070) [`f2bb4e8`](https://github.com/solana-labs/solana-web3.js/commit/f2bb4e8c7f7efd049cb1c3810291c99e9293c25d) Thanks [@steveluscher](https://github.com/steveluscher)! - Created a package for dealing with JavaScript Promises, and copied the implementation of `getAbortablePromise` into it

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

## 2.0.0-rc.4

## 2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

## 2.0.0-rc.1

### Patch Changes

- [#3071](https://github.com/solana-labs/solana-web3.js/pull/3071) [`b4bf318`](https://github.com/solana-labs/solana-web3.js/commit/b4bf318d7d4bdd639e4c126c70350993a8540fe8) Thanks [@steveluscher](https://github.com/steveluscher)! - Created a helper that you can use to race two or more promises without having to worry about them leaking memory

- [#3070](https://github.com/solana-labs/solana-web3.js/pull/3070) [`f2bb4e8`](https://github.com/solana-labs/solana-web3.js/commit/f2bb4e8c7f7efd049cb1c3810291c99e9293c25d) Thanks [@steveluscher](https://github.com/steveluscher)! - Created a package for dealing with JavaScript Promises, and copied the implementation of `getAbortablePromise` into it
