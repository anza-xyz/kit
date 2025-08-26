# @solana/transaction-messages

## 3.0.0

### Major Changes

- [#691](https://github.com/anza-xyz/kit/pull/691) [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485) Thanks [@lorisleiva](https://github.com/lorisleiva)! - BREAKING CHANGE: Removes the following deprecated types and functions: `CompilableTransactionMessage`, `ITransactionMessageWithFeePayer`, `assertIsDurableNonceTransactionMessage` and `isDurableNonceTransaction`. Removes the deprecated `readableIndices` and `writableIndices` properties from the `AddressTableLookup` type — use `readonlyIndexes` and `writableIndexes` respectively instead.

- [#594](https://github.com/anza-xyz/kit/pull/594) [`733605d`](https://github.com/anza-xyz/kit/commit/733605df84ce5f5ffea1e83eea8df74e08789642) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Extract lifetime token from `CompiledTransactionMessage`. `CompiledTransactionMessage & CompiledTransactionMessageWithLifetime` may now be used to refer to a compiled transaction message with a lifetime token. This enables `CompiledTransactionMessages` to be encoded without the need to specify a mock lifetime token.

### Minor Changes

- [#581](https://github.com/anza-xyz/kit/pull/581) [`55d6b04`](https://github.com/anza-xyz/kit/commit/55d6b040764f5e32de9c94d1844529855233d845) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow transaction messages with no lifetime constraints to be compiled. Renames `TransactionFromCompilableTransactionMessage` and `SetTransactionLifetimeFromCompilableTransactionMessage` type helpers to `TransactionFromTransactionMessage` and `SetTransactionLifetimeFromTransactionMessage` respectively, to reflect that they can now be used with transaction messages that do not have a lifetime constraint.

### Patch Changes

- [#584](https://github.com/anza-xyz/kit/pull/584) [`760fb83`](https://github.com/anza-xyz/kit/commit/760fb8319f6b53fa1baf05f9aa1246cb6c2caceb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Deprecate `CompilableTransactionMessage` in favour of `TransactionMessage & TransactionMessageWithFeePayer`

- Updated dependencies [[`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`6a183bf`](https://github.com/anza-xyz/kit/commit/6a183bf9e9d672e2d42f3aecc589a9e54d01cb1a), [`23d2fa1`](https://github.com/anza-xyz/kit/commit/23d2fa14cbd5197473eca94a1ac6c5abf221b052), [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`9feba85`](https://github.com/anza-xyz/kit/commit/9feba8557b64dd3199cd88af2c17b7ccd5d18fec), [`9205484`](https://github.com/anza-xyz/kit/commit/9205484d33af9426fc9de9594bab204b8f954faf), [`01f159a`](https://github.com/anza-xyz/kit/commit/01f159a436d7a29479aa1a1877c9b4c77da1170f), [`98eabac`](https://github.com/anza-xyz/kit/commit/98eabac905759fc6809eaabb412a5846e3a773f0)]:
    - @solana/instructions@3.0.0
    - @solana/errors@3.0.0
    - @solana/codecs-data-structures@3.0.0
    - @solana/codecs-core@3.0.0
    - @solana/addresses@3.0.0
    - @solana/codecs-numbers@3.0.0
    - @solana/rpc-types@3.0.0
    - @solana/functional@3.0.0
    - @solana/nominal-types@3.0.0

## 2.3.0

### Minor Changes

- [#468](https://github.com/anza-xyz/kit/pull/468) [`6ccbf01`](https://github.com/anza-xyz/kit/commit/6ccbf012703fce1cb40388b0f4e1ffaeffea838a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add, remove and forward the `TransactionMessageWithinSizeLimit` and `TransactionWithinSizeLimit` types in all helpers that may affect the size of a transaction or transaction message.

- [#427](https://github.com/anza-xyz/kit/pull/427) [`eb61d94`](https://github.com/anza-xyz/kit/commit/eb61d94786e212fc23778d445a94b86d2b1b024f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Rename `isDurableNonceTransaction` to `isTransactionMessageWithDurableNonceLifetime` and `assertIsDurableNonceTransactionMessage` to `assertIsTransactionMessageWithDurableNonceLifetime` for consistency with the blockhash lifetime. The old names are kept as aliases but marked as deprecated.

- [#426](https://github.com/anza-xyz/kit/pull/426) [`b7dfe03`](https://github.com/anza-xyz/kit/commit/b7dfe033a8e929d7a598d8bfea546e9ef4207639) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Deprecate the `I` prefix of four transaction message types to stay consistent with the rest of them. Namely, the following types are renamed and their old names are marked as deprecated:
    - `ITransactionMessageWithFeePayer` -> `TransactionMessageWithFeePayer`
    - `ITransactionMessageWithFeePayerSigner` -> `TransactionMessageWithFeePayerSigner`
    - `ITransactionMessageWithSigners` -> `TransactionMessageWithSigners`
    - `ITransactionMessageWithSingleSendingSigner` -> `TransactionMessageWithSingleSendingSigner`

- [#488](https://github.com/anza-xyz/kit/pull/488) [`810d6ab`](https://github.com/anza-xyz/kit/commit/810d6abafe1b7ea46ed63c491db1f5d6c16397ab) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove the `I` prefix on the following types: `IInstruction`, `IInstructionWithAccounts`, `IInstructionWithData`, `IInstructionWithSigners`, `IAccountMeta`, `IAccountLookupMeta` and `IAccountSignerMeta`. The old names are kept as aliases but marked as deprecated.

### Patch Changes

- [#432](https://github.com/anza-xyz/kit/pull/432) [`53e1336`](https://github.com/anza-xyz/kit/commit/53e1336149878c84048e0fde5c7e7ace6cc1e97f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Keep type safety when appending or prepending instructions to transaction messages

- [#430](https://github.com/anza-xyz/kit/pull/430) [`e6c0568`](https://github.com/anza-xyz/kit/commit/e6c0568ef34fdc04075af27eb102851123a02be0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Introduce a new `TransactionMessageWithLifetime` type and special Exclude type helpers to remove information from transaction messages

- Updated dependencies [[`363e3cc`](https://github.com/anza-xyz/kit/commit/363e3cc45db77a731bab1435b925fe0ad0af01df), [`eeac21d`](https://github.com/anza-xyz/kit/commit/eeac21d5fe4d8fb3ed3addee87872679ee37b4c4), [`93609aa`](https://github.com/anza-xyz/kit/commit/93609aa31dbd83086d0debd41aa2f8e9a0809761), [`b7dfe03`](https://github.com/anza-xyz/kit/commit/b7dfe033a8e929d7a598d8bfea546e9ef4207639), [`810d6ab`](https://github.com/anza-xyz/kit/commit/810d6abafe1b7ea46ed63c491db1f5d6c16397ab)]:
    - @solana/errors@2.3.0
    - @solana/instructions@2.3.0
    - @solana/addresses@2.3.0
    - @solana/codecs-core@2.3.0
    - @solana/codecs-data-structures@2.3.0
    - @solana/codecs-numbers@2.3.0
    - @solana/rpc-types@2.3.0
    - @solana/functional@2.3.0
    - @solana/nominal-types@2.3.0

## 2.2.1

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@2.2.1
    - @solana/codecs-core@2.2.1
    - @solana/codecs-data-structures@2.2.1
    - @solana/codecs-numbers@2.2.1
    - @solana/errors@2.2.1
    - @solana/functional@2.2.1
    - @solana/instructions@2.2.1
    - @solana/nominal-types@2.2.1
    - @solana/rpc-types@2.2.1

## 2.2.0

### Patch Changes

- Updated dependencies [[`85925d6`](https://github.com/anza-xyz/kit/commit/85925d64308e91b59fb748c75e4b414012eb4893), [`85925d6`](https://github.com/anza-xyz/kit/commit/85925d64308e91b59fb748c75e4b414012eb4893)]:
    - @solana/nominal-types@2.2.0
    - @solana/addresses@2.2.0
    - @solana/rpc-types@2.2.0
    - @solana/instructions@2.2.0
    - @solana/codecs-core@2.2.0
    - @solana/codecs-data-structures@2.2.0
    - @solana/codecs-numbers@2.2.0
    - @solana/errors@2.2.0
    - @solana/functional@2.2.0

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

- [#433](https://github.com/anza-xyz/kit/pull/433) [`41b679c`](https://github.com/anza-xyz/kit/commit/41b679c2646029c9c7f005de55fba687e3c89e8a) Thanks [@steveluscher](https://github.com/steveluscher)! - Deprecated the `writableIndices`/`readableIndices` spellings in transaction messages in favour of `readonlyIndexes`/`writableIndexes`. This will make this shape compatible with the output of the `getTransaction` API that uses those spellings for address lookup table data.

- [#193](https://github.com/anza-xyz/kit/pull/193) [`776e18d`](https://github.com/anza-xyz/kit/commit/776e18d75c759a839608069c61da3f70b775540b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Strip the TransactionMessageWithDurableNonceLifetime type when prepending instructions to a TransactionMessage

- [#236](https://github.com/anza-xyz/kit/pull/236) [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2) Thanks [@steveluscher](https://github.com/steveluscher)! - The minimum TypeScript version is now 5.3.3

- Updated dependencies [[`36a9dee`](https://github.com/anza-xyz/kit/commit/36a9dee4e6cbd72020dc74777fe394130b9a5f46), [`41b679c`](https://github.com/anza-xyz/kit/commit/41b679c2646029c9c7f005de55fba687e3c89e8a), [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2)]:
    - @solana/codecs-data-structures@2.1.1
    - @solana/codecs-numbers@2.1.1
    - @solana/nominal-types@2.1.1
    - @solana/instructions@2.1.1
    - @solana/codecs-core@2.1.1
    - @solana/functional@2.1.1
    - @solana/addresses@2.1.1
    - @solana/rpc-types@2.1.1
    - @solana/errors@2.1.1

## 2.1.0

### Patch Changes

- [`704d8a2`](https://github.com/anza-xyz/kit/commit/704d8a220592a5a472bd7726013814b50c991f5b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Change `data` field of transaction message instructions to use `ReadonlyUint8Array`

- Updated dependencies [[`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d), [`0c577eb`](https://github.com/anza-xyz/kit/commit/0c577eb03fa5db8b817f209d52a19a36976c7c12), [`cfe6910`](https://github.com/anza-xyz/kit/commit/cfe691010a493d06983a8a2728cda9751135906d), [`c7b7dd9`](https://github.com/anza-xyz/kit/commit/c7b7dd99aca878d2450760c214dbea593ddbadc0), [`9b179dc`](https://github.com/anza-xyz/kit/commit/9b179dc6b7c7e6e4d51481a396567f17665abbc3), [`400f4d5`](https://github.com/anza-xyz/kit/commit/400f4d5673286a197561033bba63bac9a433cc6a), [`5af7f20`](https://github.com/anza-xyz/kit/commit/5af7f2013135a79893a0f190a905c6dd077ac38c), [`704d8a2`](https://github.com/anza-xyz/kit/commit/704d8a220592a5a472bd7726013814b50c991f5b)]:
    - @solana/addresses@2.1.0
    - @solana/codecs-core@2.1.0
    - @solana/codecs-data-structures@2.1.0
    - @solana/codecs-numbers@2.1.0
    - @solana/errors@2.1.0
    - @solana/rpc-types@2.1.0
    - @solana/instructions@2.1.0
    - @solana/functional@2.1.0

## 2.0.0

### Patch Changes

- [#2969](https://github.com/solana-labs/solana-web3.js/pull/2969) [`419c12e`](https://github.com/solana-labs/solana-web3.js/commit/419c12e617435570d0cded6ca6d35370d0060da7) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add a function to replace accounts in a transaction message using lookup tables

- [#3541](https://github.com/solana-labs/solana-web3.js/pull/3541) [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Drop the Release Candidate label and publish `@solana/web3.js` at version 2.0.0

- [#3480](https://github.com/solana-labs/solana-web3.js/pull/3480) [`231a030`](https://github.com/solana-labs/solana-web3.js/commit/231a0303ae5960e783719a8ff1d17a50ff26ad78) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Change `feePayer` type of transaction messages from `Address` to `{ address: Address }`

- [#2550](https://github.com/solana-labs/solana-web3.js/pull/2550) [`54d68c4`](https://github.com/solana-labs/solana-web3.js/commit/54d68c482feebf4e62a9896b3badd77dab615941) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Refactor transactions, to separate constructing transaction messages from signing/sending compiled transactions

    A transaction message contains a transaction version and an array of transaction instructions. It may also have a fee payer and a lifetime. Transaction messages can be built up incrementally, for example by adding instructions or a fee payer.

    Transactions represent a compiled transaction message (serialized to an immutable byte array) and a map of signatures for each required signer of the transaction message. These signatures are only valid for the byte array stored in the transaction. Transactions can be signed by updating this map of signatures, and when they have a valid signature for all required signers they can be landed on the network.

    Note that this change essentially splits the previous `@solana/transactions` API in two, with functionality for creating/modifying transaction messages moved to `@solana/transaction-messages`.

- [#2607](https://github.com/solana-labs/solana-web3.js/pull/2607) [`3d90241`](https://github.com/solana-labs/solana-web3.js/commit/3d902419c1b232fa7145757b9c95976de69790c7) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Freeze the instructions and lifetimeConstraint fields within transaction messages

- [#2606](https://github.com/solana-labs/solana-web3.js/pull/2606) [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use commonjs package type

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

- Updated dependencies [[`9370133`](https://github.com/solana-labs/solana-web3.js/commit/9370133e414bfa863517248d97905449e9a867eb), [`31916ae`](https://github.com/solana-labs/solana-web3.js/commit/31916ae5d4fb29f239c63252a59745e33a6979ea), [`a548de2`](https://github.com/solana-labs/solana-web3.js/commit/a548de2ebe3cf7289fd126933c4c395c885c3224), [`292487d`](https://github.com/solana-labs/solana-web3.js/commit/292487da00ee57350e8faf49ccf961203aed6403), [`3834d82`](https://github.com/solana-labs/solana-web3.js/commit/3834d82eb1dd150f261612d742c3105194689c13), [`ff4aff6`](https://github.com/solana-labs/solana-web3.js/commit/ff4aff61c05c0ae5bfb62d35353d9527588b39b6), [`89f399d`](https://github.com/solana-labs/solana-web3.js/commit/89f399d474abac463b1daaa864c88305d7b8c21f), [`deb7b80`](https://github.com/solana-labs/solana-web3.js/commit/deb7b806b4cbe620b1714be1765c981d88c3a2f6), [`6dcf548`](https://github.com/solana-labs/solana-web3.js/commit/6dcf5483bb6bbb8d343db28dedb258c8da91ffac), [`ebb03cd`](https://github.com/solana-labs/solana-web3.js/commit/ebb03cd8270027db957d4cecc7d2374d468d4ccb), [`49a764c`](https://github.com/solana-labs/solana-web3.js/commit/49a764c6d481886501540f8dbfe8be75d754355b), [`002cc38`](https://github.com/solana-labs/solana-web3.js/commit/002cc38a99cd4c91c7ce9023e1b4fb28f7e10832), [`26dae19`](https://github.com/solana-labs/solana-web3.js/commit/26dae190c2ec835fbdaa7b7d66ca33d6ba0727b8), [`0245265`](https://github.com/solana-labs/solana-web3.js/commit/024526554fa0145e31e62a0d47f1eea556a30e71), [`ce1be3f`](https://github.com/solana-labs/solana-web3.js/commit/ce1be3fe37ea9b744fd836f3d6c2c8e5e31efd77), [`82cf07f`](https://github.com/solana-labs/solana-web3.js/commit/82cf07f4e905f6b056e70a0463a94222c3e7cadd), [`2d54650`](https://github.com/solana-labs/solana-web3.js/commit/2d5465018d8060eceb00efbf4f718df26d145199), [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4), [`bef9604`](https://github.com/solana-labs/solana-web3.js/commit/bef960435eb2303395bfa76e44f84d3348c5722d), [`7e86583`](https://github.com/solana-labs/solana-web3.js/commit/7e86583da68695076ec62033f3fe078b3890f026), [`919c736`](https://github.com/solana-labs/solana-web3.js/commit/919c7367dec8e142746295128cc6c2cc6752e636), [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df), [`677a9c4`](https://github.com/solana-labs/solana-web3.js/commit/677a9c4eb88a8ac6a9ede8d82f367c5ac8d69ff4), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`73bd5a9`](https://github.com/solana-labs/solana-web3.js/commit/73bd5a9e0b32846cd5d76f2d2d1b21661eab0677), [`2e5af9f`](https://github.com/solana-labs/solana-web3.js/commit/2e5af9f1a9410f15108863342b48225fdf9a0c83), [`2d48c09`](https://github.com/solana-labs/solana-web3.js/commit/2d48c0954a3823b937a9b4e572a8d63cd7e4631c), [`e3e82d9`](https://github.com/solana-labs/solana-web3.js/commit/e3e82d909825e958ae234ed18500335a621773bd), [`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090), [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418), [`288029a`](https://github.com/solana-labs/solana-web3.js/commit/288029a55a5eeb863b6df960027a59214ffc37f1), [`4ae78f5`](https://github.com/solana-labs/solana-web3.js/commit/4ae78f5cdddd6772b25351beb813483d4e52cea6), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a), [`bf029dd`](https://github.com/solana-labs/solana-web3.js/commit/bf029dd90230405b3d59f70aedd57fc0117b926e), [`125fc15`](https://github.com/solana-labs/solana-web3.js/commit/125fc1540cfbc0a4afdba5aabac0884c750e58c1)]:
    - @solana/errors@2.0.0
    - @solana/codecs-data-structures@2.0.0
    - @solana/codecs-core@2.0.0
    - @solana/addresses@2.0.0
    - @solana/rpc-types@2.0.0
    - @solana/codecs-numbers@2.0.0
    - @solana/instructions@2.0.0
    - @solana/functional@2.0.0

## 2.0.0-rc.4

### Patch Changes

- Updated dependencies [[`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090)]:
    - @solana/errors@2.0.0-rc.4
    - @solana/addresses@2.0.0-rc.4
    - @solana/codecs-core@2.0.0-rc.4
    - @solana/codecs-data-structures@2.0.0-rc.4
    - @solana/codecs-numbers@2.0.0-rc.4
    - @solana/instructions@2.0.0-rc.4
    - @solana/rpc-types@2.0.0-rc.4
    - @solana/functional@2.0.0-rc.4

## 2.0.0-rc.3

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@2.0.0-rc.3
    - @solana/codecs-core@2.0.0-rc.3
    - @solana/codecs-data-structures@2.0.0-rc.3
    - @solana/codecs-numbers@2.0.0-rc.3
    - @solana/errors@2.0.0-rc.3
    - @solana/functional@2.0.0-rc.3
    - @solana/instructions@2.0.0-rc.3
    - @solana/rpc-types@2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- [#3480](https://github.com/solana-labs/solana-web3.js/pull/3480) [`231a030`](https://github.com/solana-labs/solana-web3.js/commit/231a0303ae5960e783719a8ff1d17a50ff26ad78) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Change `feePayer` type of transaction messages from `Address` to `{ address: Address }`

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

- Updated dependencies [[`292487d`](https://github.com/solana-labs/solana-web3.js/commit/292487da00ee57350e8faf49ccf961203aed6403), [`3834d82`](https://github.com/solana-labs/solana-web3.js/commit/3834d82eb1dd150f261612d742c3105194689c13), [`0245265`](https://github.com/solana-labs/solana-web3.js/commit/024526554fa0145e31e62a0d47f1eea556a30e71), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a)]:
    - @solana/addresses@2.0.0-rc.2
    - @solana/rpc-types@2.0.0-rc.2
    - @solana/errors@2.0.0-rc.2
    - @solana/codecs-data-structures@2.0.0-rc.2
    - @solana/codecs-numbers@2.0.0-rc.2
    - @solana/instructions@2.0.0-rc.2
    - @solana/codecs-core@2.0.0-rc.2
    - @solana/functional@2.0.0-rc.2

## 2.0.0-rc.1

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@2.0.0-rc.1
    - @solana/codecs-core@2.0.0-rc.1
    - @solana/codecs-data-structures@2.0.0-rc.1
    - @solana/codecs-numbers@2.0.0-rc.1
    - @solana/errors@2.0.0-rc.1
    - @solana/functional@2.0.0-rc.1
    - @solana/instructions@2.0.0-rc.1
    - @solana/rpc-types@2.0.0-rc.1

## 2.0.0-rc.0

### Patch Changes

- [#2969](https://github.com/solana-labs/solana-web3.js/pull/2969) [`419c12e`](https://github.com/solana-labs/solana-web3.js/commit/419c12e617435570d0cded6ca6d35370d0060da7) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add a function to replace accounts in a transaction message using lookup tables

- Updated dependencies [[`677a9c4`](https://github.com/solana-labs/solana-web3.js/commit/677a9c4eb88a8ac6a9ede8d82f367c5ac8d69ff4)]:
    - @solana/errors@2.0.0-rc.0
    - @solana/addresses@2.0.0-rc.0
    - @solana/codecs-core@2.0.0-rc.0
    - @solana/codecs-data-structures@2.0.0-rc.0
    - @solana/codecs-numbers@2.0.0-rc.0
    - @solana/instructions@2.0.0-rc.0
    - @solana/rpc-types@2.0.0-rc.0
    - @solana/functional@2.0.0-rc.0

## 2.0.0-preview.4

### Patch Changes

- [#2607](https://github.com/solana-labs/solana-web3.js/pull/2607) [`3d90241`](https://github.com/solana-labs/solana-web3.js/commit/3d902419c1b232fa7145757b9c95976de69790c7) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Freeze the instructions and lifetimeConstraint fields within transaction messages

- [#2606](https://github.com/solana-labs/solana-web3.js/pull/2606) [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use commonjs package type

- Updated dependencies [[`26dae19`](https://github.com/solana-labs/solana-web3.js/commit/26dae190c2ec835fbdaa7b7d66ca33d6ba0727b8), [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df), [`73bd5a9`](https://github.com/solana-labs/solana-web3.js/commit/73bd5a9e0b32846cd5d76f2d2d1b21661eab0677), [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b)]:
    - @solana/codecs-data-structures@2.0.0-preview.4
    - @solana/errors@2.0.0-preview.4
    - @solana/rpc-types@2.0.0-preview.4
    - @solana/codecs-numbers@2.0.0-preview.4
    - @solana/instructions@2.0.0-preview.4
    - @solana/codecs-core@2.0.0-preview.4
    - @solana/functional@2.0.0-preview.4
    - @solana/addresses@2.0.0-preview.4

## 2.0.0-preview.3

### Patch Changes

- [#2550](https://github.com/solana-labs/solana-web3.js/pull/2550) [`54d68c4`](https://github.com/solana-labs/solana-web3.js/commit/54d68c482feebf4e62a9896b3badd77dab615941) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Refactor transactions, to separate constructing transaction messages from signing/sending compiled transactions

    A transaction message contains a transaction version and an array of transaction instructions. It may also have a fee payer and a lifetime. Transaction messages can be built up incrementally, for example by adding instructions or a fee payer.

    Transactions represent a compiled transaction message (serialized to an immutable byte array) and a map of signatures for each required signer of the transaction message. These signatures are only valid for the byte array stored in the transaction. Transactions can be signed by updating this map of signatures, and when they have a valid signature for all required signers they can be landed on the network.

    Note that this change essentially splits the previous `@solana/transactions` API in two, with functionality for creating/modifying transaction messages moved to `@solana/transaction-messages`.

- Updated dependencies [[`9370133`](https://github.com/solana-labs/solana-web3.js/commit/9370133e414bfa863517248d97905449e9a867eb), [`31916ae`](https://github.com/solana-labs/solana-web3.js/commit/31916ae5d4fb29f239c63252a59745e33a6979ea), [`a548de2`](https://github.com/solana-labs/solana-web3.js/commit/a548de2ebe3cf7289fd126933c4c395c885c3224), [`ff4aff6`](https://github.com/solana-labs/solana-web3.js/commit/ff4aff61c05c0ae5bfb62d35353d9527588b39b6), [`89f399d`](https://github.com/solana-labs/solana-web3.js/commit/89f399d474abac463b1daaa864c88305d7b8c21f), [`deb7b80`](https://github.com/solana-labs/solana-web3.js/commit/deb7b806b4cbe620b1714be1765c981d88c3a2f6), [`6dcf548`](https://github.com/solana-labs/solana-web3.js/commit/6dcf5483bb6bbb8d343db28dedb258c8da91ffac), [`ebb03cd`](https://github.com/solana-labs/solana-web3.js/commit/ebb03cd8270027db957d4cecc7d2374d468d4ccb), [`49a764c`](https://github.com/solana-labs/solana-web3.js/commit/49a764c6d481886501540f8dbfe8be75d754355b), [`002cc38`](https://github.com/solana-labs/solana-web3.js/commit/002cc38a99cd4c91c7ce9023e1b4fb28f7e10832), [`ce1be3f`](https://github.com/solana-labs/solana-web3.js/commit/ce1be3fe37ea9b744fd836f3d6c2c8e5e31efd77), [`82cf07f`](https://github.com/solana-labs/solana-web3.js/commit/82cf07f4e905f6b056e70a0463a94222c3e7cadd), [`2d54650`](https://github.com/solana-labs/solana-web3.js/commit/2d5465018d8060eceb00efbf4f718df26d145199), [`bef9604`](https://github.com/solana-labs/solana-web3.js/commit/bef960435eb2303395bfa76e44f84d3348c5722d), [`7e86583`](https://github.com/solana-labs/solana-web3.js/commit/7e86583da68695076ec62033f3fe078b3890f026), [`919c736`](https://github.com/solana-labs/solana-web3.js/commit/919c7367dec8e142746295128cc6c2cc6752e636), [`2e5af9f`](https://github.com/solana-labs/solana-web3.js/commit/2e5af9f1a9410f15108863342b48225fdf9a0c83), [`2d48c09`](https://github.com/solana-labs/solana-web3.js/commit/2d48c0954a3823b937a9b4e572a8d63cd7e4631c), [`e3e82d9`](https://github.com/solana-labs/solana-web3.js/commit/e3e82d909825e958ae234ed18500335a621773bd), [`288029a`](https://github.com/solana-labs/solana-web3.js/commit/288029a55a5eeb863b6df960027a59214ffc37f1), [`4ae78f5`](https://github.com/solana-labs/solana-web3.js/commit/4ae78f5cdddd6772b25351beb813483d4e52cea6), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`bf029dd`](https://github.com/solana-labs/solana-web3.js/commit/bf029dd90230405b3d59f70aedd57fc0117b926e), [`125fc15`](https://github.com/solana-labs/solana-web3.js/commit/125fc1540cfbc0a4afdba5aabac0884c750e58c1)]:
    - @solana/errors@2.0.0-preview.3
    - @solana/codecs-data-structures@2.0.0-preview.3
    - @solana/codecs-core@2.0.0-preview.3
    - @solana/addresses@2.0.0-preview.3
    - @solana/rpc-types@2.0.0-preview.3
    - @solana/codecs-numbers@2.0.0-preview.3
    - @solana/instructions@2.0.0-preview.3
    - @solana/functional@2.0.0-preview.3
