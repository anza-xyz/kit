# @solana/signers

## 3.0.0

### Major Changes

- [#574](https://github.com/anza-xyz/kit/pull/574) [`0bd053b`](https://github.com/anza-xyz/kit/commit/0bd053bfa40b095d37bea7b7cd695259ba5a9cdc) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add the `TransactionWithLifetime` requirement when signing transactions. This is because, whilst a lifetime may not always be required before compile a transaction message, it is always required when signing a transaction. Otherwise, the transaction signatures will be invalid when one is added later.

- [#462](https://github.com/anza-xyz/kit/pull/462) [`a74ea02`](https://github.com/anza-xyz/kit/commit/a74ea0267bf589fba50bb2ebe72dc4f73da9adcf) Thanks [@lorisleiva](https://github.com/lorisleiva)! - BREAKING CHANGE: The `FullySignedTransaction` no longer extends the `Transaction` type so it can be composed with other flags that also narrow transaction types. This means, whenever `FullySignedTransaction` is used on its own, it will need to be replaced with `FullySignedTransaction & Transaction`.

- [#691](https://github.com/anza-xyz/kit/pull/691) [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485) Thanks [@lorisleiva](https://github.com/lorisleiva)! - BREAKING CHANGE: Removes the following deprecated types: `ITransactionMessageWithSigners`, `ITransactionMessageWithFeePayerSigner`, `ITransactionMessageWithSingleSendingSigner`, `IAccountSignerMeta` and `IInstructionWithSigners`.

### Minor Changes

- [#582](https://github.com/anza-xyz/kit/pull/582) [`93ae6f9`](https://github.com/anza-xyz/kit/commit/93ae6f96859019b6c7ea9a596ffb9b1be7a35e64) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow transaction messages with no lifetime constraints to be signed using the Signer API helpers such as `signTransactionMessageWithSigners` and `partiallySignTransactionMessageWithSigners`. This is because some `TransactionSigners` such as `TransactionModifyingSigners` have the ability to update the transaction before signing it, meaning that the lifetime constraint may not be known until the transaction is signed.

- [#581](https://github.com/anza-xyz/kit/pull/581) [`55d6b04`](https://github.com/anza-xyz/kit/commit/55d6b040764f5e32de9c94d1844529855233d845) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow transaction messages with no lifetime constraints to be compiled. Renames `TransactionFromCompilableTransactionMessage` and `SetTransactionLifetimeFromCompilableTransactionMessage` type helpers to `TransactionFromTransactionMessage` and `SetTransactionLifetimeFromTransactionMessage` respectively, to reflect that they can now be used with transaction messages that do not have a lifetime constraint.

### Patch Changes

- [#584](https://github.com/anza-xyz/kit/pull/584) [`760fb83`](https://github.com/anza-xyz/kit/commit/760fb8319f6b53fa1baf05f9aa1246cb6c2caceb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Deprecate `CompilableTransactionMessage` in favour of `TransactionMessage & TransactionMessageWithFeePayer`

- Updated dependencies [[`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`6a183bf`](https://github.com/anza-xyz/kit/commit/6a183bf9e9d672e2d42f3aecc589a9e54d01cb1a), [`760fb83`](https://github.com/anza-xyz/kit/commit/760fb8319f6b53fa1baf05f9aa1246cb6c2caceb), [`23d2fa1`](https://github.com/anza-xyz/kit/commit/23d2fa14cbd5197473eca94a1ac6c5abf221b052), [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`a894d53`](https://github.com/anza-xyz/kit/commit/a894d53192d50b5d2217ada2cb715d71ef4f8f02), [`9feba85`](https://github.com/anza-xyz/kit/commit/9feba8557b64dd3199cd88af2c17b7ccd5d18fec), [`00d66fb`](https://github.com/anza-xyz/kit/commit/00d66fbec15288bb531f7459b6baa48aead1cdc6), [`733605d`](https://github.com/anza-xyz/kit/commit/733605df84ce5f5ffea1e83eea8df74e08789642), [`01f159a`](https://github.com/anza-xyz/kit/commit/01f159a436d7a29479aa1a1877c9b4c77da1170f), [`98eabac`](https://github.com/anza-xyz/kit/commit/98eabac905759fc6809eaabb412a5846e3a773f0), [`0bd053b`](https://github.com/anza-xyz/kit/commit/0bd053bfa40b095d37bea7b7cd695259ba5a9cdc), [`55d6b04`](https://github.com/anza-xyz/kit/commit/55d6b040764f5e32de9c94d1844529855233d845), [`a74ea02`](https://github.com/anza-xyz/kit/commit/a74ea0267bf589fba50bb2ebe72dc4f73da9adcf)]:
    - @solana/transaction-messages@3.0.0
    - @solana/instructions@3.0.0
    - @solana/errors@3.0.0
    - @solana/transactions@3.0.0
    - @solana/codecs-core@3.0.0
    - @solana/addresses@3.0.0
    - @solana/keys@3.0.0
    - @solana/nominal-types@3.0.0

## 2.3.0

### Minor Changes

- [#468](https://github.com/anza-xyz/kit/pull/468) [`6ccbf01`](https://github.com/anza-xyz/kit/commit/6ccbf012703fce1cb40388b0f4e1ffaeffea838a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add, remove and forward the `TransactionMessageWithinSizeLimit` and `TransactionWithinSizeLimit` types in all helpers that may affect the size of a transaction or transaction message.

- [#426](https://github.com/anza-xyz/kit/pull/426) [`b7dfe03`](https://github.com/anza-xyz/kit/commit/b7dfe033a8e929d7a598d8bfea546e9ef4207639) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Deprecate the `I` prefix of four transaction message types to stay consistent with the rest of them. Namely, the following types are renamed and their old names are marked as deprecated:
    - `ITransactionMessageWithFeePayer` -> `TransactionMessageWithFeePayer`
    - `ITransactionMessageWithFeePayerSigner` -> `TransactionMessageWithFeePayerSigner`
    - `ITransactionMessageWithSigners` -> `TransactionMessageWithSigners`
    - `ITransactionMessageWithSingleSendingSigner` -> `TransactionMessageWithSingleSendingSigner`

- [#488](https://github.com/anza-xyz/kit/pull/488) [`810d6ab`](https://github.com/anza-xyz/kit/commit/810d6abafe1b7ea46ed63c491db1f5d6c16397ab) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove the `I` prefix on the following types: `IInstruction`, `IInstructionWithAccounts`, `IInstructionWithData`, `IInstructionWithSigners`, `IAccountMeta`, `IAccountLookupMeta` and `IAccountSignerMeta`. The old names are kept as aliases but marked as deprecated.

### Patch Changes

- Updated dependencies [[`6ccbf01`](https://github.com/anza-xyz/kit/commit/6ccbf012703fce1cb40388b0f4e1ffaeffea838a), [`53e1336`](https://github.com/anza-xyz/kit/commit/53e1336149878c84048e0fde5c7e7ace6cc1e97f), [`363e3cc`](https://github.com/anza-xyz/kit/commit/363e3cc45db77a731bab1435b925fe0ad0af01df), [`eb61d94`](https://github.com/anza-xyz/kit/commit/eb61d94786e212fc23778d445a94b86d2b1b024f), [`eeac21d`](https://github.com/anza-xyz/kit/commit/eeac21d5fe4d8fb3ed3addee87872679ee37b4c4), [`bbcb913`](https://github.com/anza-xyz/kit/commit/bbcb913839d33abc746f38d6e65e7bfd30cd2ac6), [`93609aa`](https://github.com/anza-xyz/kit/commit/93609aa31dbd83086d0debd41aa2f8e9a0809761), [`b7dfe03`](https://github.com/anza-xyz/kit/commit/b7dfe033a8e929d7a598d8bfea546e9ef4207639), [`e6c0568`](https://github.com/anza-xyz/kit/commit/e6c0568ef34fdc04075af27eb102851123a02be0), [`810d6ab`](https://github.com/anza-xyz/kit/commit/810d6abafe1b7ea46ed63c491db1f5d6c16397ab)]:
    - @solana/transaction-messages@2.3.0
    - @solana/transactions@2.3.0
    - @solana/errors@2.3.0
    - @solana/instructions@2.3.0
    - @solana/addresses@2.3.0
    - @solana/codecs-core@2.3.0
    - @solana/keys@2.3.0
    - @solana/nominal-types@2.3.0

## 2.2.1

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@2.2.1
    - @solana/codecs-core@2.2.1
    - @solana/errors@2.2.1
    - @solana/instructions@2.2.1
    - @solana/keys@2.2.1
    - @solana/nominal-types@2.2.1
    - @solana/transaction-messages@2.2.1
    - @solana/transactions@2.2.1

## 2.2.0

### Patch Changes

- Updated dependencies [[`85925d6`](https://github.com/anza-xyz/kit/commit/85925d64308e91b59fb748c75e4b414012eb4893), [`85925d6`](https://github.com/anza-xyz/kit/commit/85925d64308e91b59fb748c75e4b414012eb4893)]:
    - @solana/nominal-types@2.2.0
    - @solana/addresses@2.2.0
    - @solana/keys@2.2.0
    - @solana/transaction-messages@2.2.0
    - @solana/transactions@2.2.0
    - @solana/instructions@2.2.0
    - @solana/codecs-core@2.2.0
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

- Updated dependencies [[`36a9dee`](https://github.com/anza-xyz/kit/commit/36a9dee4e6cbd72020dc74777fe394130b9a5f46), [`41b679c`](https://github.com/anza-xyz/kit/commit/41b679c2646029c9c7f005de55fba687e3c89e8a), [`776e18d`](https://github.com/anza-xyz/kit/commit/776e18d75c759a839608069c61da3f70b775540b), [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2)]:
    - @solana/transaction-messages@2.1.1
    - @solana/nominal-types@2.1.1
    - @solana/instructions@2.1.1
    - @solana/transactions@2.1.1
    - @solana/codecs-core@2.1.1
    - @solana/addresses@2.1.1
    - @solana/errors@2.1.1
    - @solana/keys@2.1.1

## 2.1.0

### Patch Changes

- [#151](https://github.com/anza-xyz/kit/pull/151) [`a1e45a1`](https://github.com/anza-xyz/kit/commit/a1e45a1d91ba1ac530eea0986b2ffeafb9713aec) Thanks [@lorisleiva](https://github.com/lorisleiva)! - `addSignersToTransactionMessage` now upgrades `feePayer` to a signer when applicable

- [`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d) Thanks [@leantOnSol](https://github.com/leantOnSol)! - A two-versions-old version of Node LTS is now specified everywhere via the `engines` field, including the one in the root of the `pnpm` workspace, and engine-strictness is delegated to the `.npmrc` files.

- Updated dependencies [[`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d), [`d1c787c`](https://github.com/anza-xyz/kit/commit/d1c787c447bd134e6a6da8be059c8353f92b2f9a), [`0c577eb`](https://github.com/anza-xyz/kit/commit/0c577eb03fa5db8b817f209d52a19a36976c7c12), [`c7b7dd9`](https://github.com/anza-xyz/kit/commit/c7b7dd99aca878d2450760c214dbea593ddbadc0), [`5af7f20`](https://github.com/anza-xyz/kit/commit/5af7f2013135a79893a0f190a905c6dd077ac38c), [`704d8a2`](https://github.com/anza-xyz/kit/commit/704d8a220592a5a472bd7726013814b50c991f5b)]:
    - @solana/addresses@2.1.0
    - @solana/codecs-core@2.1.0
    - @solana/errors@2.1.0
    - @solana/keys@2.1.0
    - @solana/transaction-messages@2.1.0
    - @solana/instructions@2.1.0
    - @solana/transactions@2.1.0

## 2.0.0

### Minor Changes

- [#2858](https://github.com/solana-labs/solana-web3.js/pull/2858) [`22a34aa`](https://github.com/solana-labs/solana-web3.js/commit/22a34aa08d1be7e9b43ccfea94a99eaa2694e491) Thanks [@steveluscher](https://github.com/steveluscher)! - Transaction signers' methods now take `minContextSlot` as an option. This is important for signers that simulate transactions, like wallets. They might be interested in knowing the slot at which the transaction was prepared, lest they run simulation at too early a slot.

### Patch Changes

- [#3051](https://github.com/solana-labs/solana-web3.js/pull/3051) [`1ad523d`](https://github.com/solana-labs/solana-web3.js/commit/1ad523dc5792d9152a66e9dc2b83294e3eba4db0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add a `createKeyPairSignerFromPrivateKeyBytes` helper that compose `createKeyPairFromPrivateKeyBytes` and `createSignerFromKeyPair`.

- [#3541](https://github.com/solana-labs/solana-web3.js/pull/3541) [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Drop the Release Candidate label and publish `@solana/web3.js` at version 2.0.0

- [#2852](https://github.com/solana-labs/solana-web3.js/pull/2852) [`cec9048`](https://github.com/solana-labs/solana-web3.js/commit/cec9048b2f83535df7e499db5488c336981dfb5a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - The `signAndSendTransactionMessageWithSigners` function now automatically asserts that the provided transaction message contains a single sending signer and fails otherwise.

- [#2707](https://github.com/solana-labs/solana-web3.js/pull/2707) [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Allow creating keypairs and keys from ReadonlyUint8Array

- [#2606](https://github.com/solana-labs/solana-web3.js/pull/2606) [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use commonjs package type

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

- [#3481](https://github.com/solana-labs/solana-web3.js/pull/3481) [`4decebb`](https://github.com/solana-labs/solana-web3.js/commit/4decebb9b619972f49c740323b59cf470696e105) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove the `feePayerSigner` attribute of transaction messages in favour of the existing `feePayer` attribute. This ensures fee payers are defined in a single place — whether they are using signers or not.

- [#3482](https://github.com/solana-labs/solana-web3.js/pull/3482) [`d4965ec`](https://github.com/solana-labs/solana-web3.js/commit/d4965ece9abaf81e3006442db15f3f77d89a622c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Override `feePayer` signer when the address matches the existing one. This is because users may want to provide a different wallet from the same address.

- Updated dependencies [[`9370133`](https://github.com/solana-labs/solana-web3.js/commit/9370133e414bfa863517248d97905449e9a867eb), [`31916ae`](https://github.com/solana-labs/solana-web3.js/commit/31916ae5d4fb29f239c63252a59745e33a6979ea), [`a548de2`](https://github.com/solana-labs/solana-web3.js/commit/a548de2ebe3cf7289fd126933c4c395c885c3224), [`292487d`](https://github.com/solana-labs/solana-web3.js/commit/292487da00ee57350e8faf49ccf961203aed6403), [`7d310f6`](https://github.com/solana-labs/solana-web3.js/commit/7d310f6f9cd7d02fca4d6f8e311b857c9dd84e61), [`419c12e`](https://github.com/solana-labs/solana-web3.js/commit/419c12e617435570d0cded6ca6d35370d0060da7), [`89f399d`](https://github.com/solana-labs/solana-web3.js/commit/89f399d474abac463b1daaa864c88305d7b8c21f), [`ebb03cd`](https://github.com/solana-labs/solana-web3.js/commit/ebb03cd8270027db957d4cecc7d2374d468d4ccb), [`002cc38`](https://github.com/solana-labs/solana-web3.js/commit/002cc38a99cd4c91c7ce9023e1b4fb28f7e10832), [`ce1be3f`](https://github.com/solana-labs/solana-web3.js/commit/ce1be3fe37ea9b744fd836f3d6c2c8e5e31efd77), [`82cf07f`](https://github.com/solana-labs/solana-web3.js/commit/82cf07f4e905f6b056e70a0463a94222c3e7cadd), [`2d54650`](https://github.com/solana-labs/solana-web3.js/commit/2d5465018d8060eceb00efbf4f718df26d145199), [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4), [`bef9604`](https://github.com/solana-labs/solana-web3.js/commit/bef960435eb2303395bfa76e44f84d3348c5722d), [`7e86583`](https://github.com/solana-labs/solana-web3.js/commit/7e86583da68695076ec62033f3fe078b3890f026), [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df), [`231a030`](https://github.com/solana-labs/solana-web3.js/commit/231a0303ae5960e783719a8ff1d17a50ff26ad78), [`677a9c4`](https://github.com/solana-labs/solana-web3.js/commit/677a9c4eb88a8ac6a9ede8d82f367c5ac8d69ff4), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`2e5af9f`](https://github.com/solana-labs/solana-web3.js/commit/2e5af9f1a9410f15108863342b48225fdf9a0c83), [`e3e82d9`](https://github.com/solana-labs/solana-web3.js/commit/e3e82d909825e958ae234ed18500335a621773bd), [`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090), [`54d68c4`](https://github.com/solana-labs/solana-web3.js/commit/54d68c482feebf4e62a9896b3badd77dab615941), [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418), [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147), [`288029a`](https://github.com/solana-labs/solana-web3.js/commit/288029a55a5eeb863b6df960027a59214ffc37f1), [`4ae78f5`](https://github.com/solana-labs/solana-web3.js/commit/4ae78f5cdddd6772b25351beb813483d4e52cea6), [`3d90241`](https://github.com/solana-labs/solana-web3.js/commit/3d902419c1b232fa7145757b9c95976de69790c7), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a), [`0158b31`](https://github.com/solana-labs/solana-web3.js/commit/0158b3181ed96996f269f3bff689f76411e460b3), [`f9a8446`](https://github.com/solana-labs/solana-web3.js/commit/f9a84460670a97d4ab6514b28fe0d29c6fac3302), [`125fc15`](https://github.com/solana-labs/solana-web3.js/commit/125fc1540cfbc0a4afdba5aabac0884c750e58c1)]:
    - @solana/errors@2.0.0
    - @solana/transactions@2.0.0
    - @solana/codecs-core@2.0.0
    - @solana/addresses@2.0.0
    - @solana/keys@2.0.0
    - @solana/transaction-messages@2.0.0
    - @solana/instructions@2.0.0

## 2.0.0-rc.4

### Patch Changes

- Updated dependencies [[`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090)]:
    - @solana/errors@2.0.0-rc.4
    - @solana/addresses@2.0.0-rc.4
    - @solana/codecs-core@2.0.0-rc.4
    - @solana/instructions@2.0.0-rc.4
    - @solana/keys@2.0.0-rc.4
    - @solana/transaction-messages@2.0.0-rc.4
    - @solana/transactions@2.0.0-rc.4

## 2.0.0-rc.3

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@2.0.0-rc.3
    - @solana/codecs-core@2.0.0-rc.3
    - @solana/errors@2.0.0-rc.3
    - @solana/instructions@2.0.0-rc.3
    - @solana/keys@2.0.0-rc.3
    - @solana/transaction-messages@2.0.0-rc.3
    - @solana/transactions@2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

- [#3481](https://github.com/solana-labs/solana-web3.js/pull/3481) [`4decebb`](https://github.com/solana-labs/solana-web3.js/commit/4decebb9b619972f49c740323b59cf470696e105) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove the `feePayerSigner` attribute of transaction messages in favour of the existing `feePayer` attribute. This ensures fee payers are defined in a single place — whether they are using signers or not.

- [#3482](https://github.com/solana-labs/solana-web3.js/pull/3482) [`d4965ec`](https://github.com/solana-labs/solana-web3.js/commit/d4965ece9abaf81e3006442db15f3f77d89a622c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Override `feePayer` signer when the address matches the existing one. This is because users may want to provide a different wallet from the same address.

- Updated dependencies [[`292487d`](https://github.com/solana-labs/solana-web3.js/commit/292487da00ee57350e8faf49ccf961203aed6403), [`231a030`](https://github.com/solana-labs/solana-web3.js/commit/231a0303ae5960e783719a8ff1d17a50ff26ad78), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a), [`0158b31`](https://github.com/solana-labs/solana-web3.js/commit/0158b3181ed96996f269f3bff689f76411e460b3)]:
    - @solana/addresses@2.0.0-rc.2
    - @solana/transaction-messages@2.0.0-rc.2
    - @solana/errors@2.0.0-rc.2
    - @solana/instructions@2.0.0-rc.2
    - @solana/transactions@2.0.0-rc.2
    - @solana/codecs-core@2.0.0-rc.2
    - @solana/keys@2.0.0-rc.2

## 2.0.0-rc.1

### Patch Changes

- [#3051](https://github.com/solana-labs/solana-web3.js/pull/3051) [`1ad523d`](https://github.com/solana-labs/solana-web3.js/commit/1ad523dc5792d9152a66e9dc2b83294e3eba4db0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add a `createKeyPairSignerFromPrivateKeyBytes` helper that compose `createKeyPairFromPrivateKeyBytes` and `createSignerFromKeyPair`.

- Updated dependencies [[`7d310f6`](https://github.com/solana-labs/solana-web3.js/commit/7d310f6f9cd7d02fca4d6f8e311b857c9dd84e61), [`f9a8446`](https://github.com/solana-labs/solana-web3.js/commit/f9a84460670a97d4ab6514b28fe0d29c6fac3302)]:
    - @solana/keys@2.0.0-rc.1
    - @solana/transactions@2.0.0-rc.1
    - @solana/addresses@2.0.0-rc.1
    - @solana/codecs-core@2.0.0-rc.1
    - @solana/errors@2.0.0-rc.1
    - @solana/instructions@2.0.0-rc.1
    - @solana/transaction-messages@2.0.0-rc.1

## 2.0.0-rc.0

### Patch Changes

- Updated dependencies [[`419c12e`](https://github.com/solana-labs/solana-web3.js/commit/419c12e617435570d0cded6ca6d35370d0060da7), [`677a9c4`](https://github.com/solana-labs/solana-web3.js/commit/677a9c4eb88a8ac6a9ede8d82f367c5ac8d69ff4)]:
    - @solana/transaction-messages@2.0.0-rc.0
    - @solana/errors@2.0.0-rc.0
    - @solana/transactions@2.0.0-rc.0
    - @solana/addresses@2.0.0-rc.0
    - @solana/codecs-core@2.0.0-rc.0
    - @solana/instructions@2.0.0-rc.0
    - @solana/keys@2.0.0-rc.0

## 2.0.0-preview.4

### Minor Changes

- [#2858](https://github.com/solana-labs/solana-web3.js/pull/2858) [`22a34aa`](https://github.com/solana-labs/solana-web3.js/commit/22a34aa08d1be7e9b43ccfea94a99eaa2694e491) Thanks [@steveluscher](https://github.com/steveluscher)! - Transaction signers' methods now take `minContextSlot` as an option. This is important for signers that simulate transactions, like wallets. They might be interested in knowing the slot at which the transaction was prepared, lest they run simulation at too early a slot.

### Patch Changes

- [#2852](https://github.com/solana-labs/solana-web3.js/pull/2852) [`cec9048`](https://github.com/solana-labs/solana-web3.js/commit/cec9048b2f83535df7e499db5488c336981dfb5a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - The `signAndSendTransactionMessageWithSigners` function now automatically asserts that the provided transaction message contains a single sending signer and fails otherwise.

- [#2707](https://github.com/solana-labs/solana-web3.js/pull/2707) [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Allow creating keypairs and keys from ReadonlyUint8Array

- [#2606](https://github.com/solana-labs/solana-web3.js/pull/2606) [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use commonjs package type

- Updated dependencies [[`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df), [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418), [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147), [`3d90241`](https://github.com/solana-labs/solana-web3.js/commit/3d902419c1b232fa7145757b9c95976de69790c7), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b)]:
    - @solana/errors@2.0.0-preview.4
    - @solana/keys@2.0.0-preview.4
    - @solana/transaction-messages@2.0.0-preview.4
    - @solana/instructions@2.0.0-preview.4
    - @solana/transactions@2.0.0-preview.4
    - @solana/codecs-core@2.0.0-preview.4
    - @solana/addresses@2.0.0-preview.4

## 2.0.0-preview.3

### Patch Changes

- Updated dependencies [[`9370133`](https://github.com/solana-labs/solana-web3.js/commit/9370133e414bfa863517248d97905449e9a867eb), [`31916ae`](https://github.com/solana-labs/solana-web3.js/commit/31916ae5d4fb29f239c63252a59745e33a6979ea), [`89f399d`](https://github.com/solana-labs/solana-web3.js/commit/89f399d474abac463b1daaa864c88305d7b8c21f), [`ebb03cd`](https://github.com/solana-labs/solana-web3.js/commit/ebb03cd8270027db957d4cecc7d2374d468d4ccb), [`002cc38`](https://github.com/solana-labs/solana-web3.js/commit/002cc38a99cd4c91c7ce9023e1b4fb28f7e10832), [`ce1be3f`](https://github.com/solana-labs/solana-web3.js/commit/ce1be3fe37ea9b744fd836f3d6c2c8e5e31efd77), [`82cf07f`](https://github.com/solana-labs/solana-web3.js/commit/82cf07f4e905f6b056e70a0463a94222c3e7cadd), [`2d54650`](https://github.com/solana-labs/solana-web3.js/commit/2d5465018d8060eceb00efbf4f718df26d145199), [`bef9604`](https://github.com/solana-labs/solana-web3.js/commit/bef960435eb2303395bfa76e44f84d3348c5722d), [`7e86583`](https://github.com/solana-labs/solana-web3.js/commit/7e86583da68695076ec62033f3fe078b3890f026), [`2e5af9f`](https://github.com/solana-labs/solana-web3.js/commit/2e5af9f1a9410f15108863342b48225fdf9a0c83), [`e3e82d9`](https://github.com/solana-labs/solana-web3.js/commit/e3e82d909825e958ae234ed18500335a621773bd), [`54d68c4`](https://github.com/solana-labs/solana-web3.js/commit/54d68c482feebf4e62a9896b3badd77dab615941), [`288029a`](https://github.com/solana-labs/solana-web3.js/commit/288029a55a5eeb863b6df960027a59214ffc37f1), [`4ae78f5`](https://github.com/solana-labs/solana-web3.js/commit/4ae78f5cdddd6772b25351beb813483d4e52cea6), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`125fc15`](https://github.com/solana-labs/solana-web3.js/commit/125fc1540cfbc0a4afdba5aabac0884c750e58c1)]:
    - @solana/errors@2.0.0-preview.3
    - @solana/transactions@2.0.0-preview.3
    - @solana/addresses@2.0.0-preview.3
    - @solana/transaction-messages@2.0.0-preview.3
    - @solana/keys@2.0.0-preview.3
    - @solana/instructions@2.0.0-preview.3

## 2.0.0-preview.2

### Patch Changes

- The first Technology Preview of `@solana/web3.js` 2.0 was [released at the Breakpoint conference](https://www.youtube.com/watch?v=JUJtAPhES5g) in November 2023. Based on your feedback, we want to get a second version of it into your hands now with some changes, bug fixes, and new features.

    To install the second Technology Preview:

    ```shell
    npm install --save @solana/web3.js@tp2
    ```

    Most notably, this release integrates with the new JavaScript client generator for on-chain programs. Instruction creators and account decoders can now be autogenerated for any program, including your own! Read more [here](https://github.com/solana-program/create-solana-program), and check out the growing list of autogenerated core programs [here](https://www.npmjs.com/search?q=%40solana-program).

    Try a demo of Technology Preview 2 in your browser at https://sola.na/web3tp2demo.
    - Renamed `Base58EncodedAddress` to `Address` (#1814) [63683a4bc](https://github.com/solana-labs/solana-web3.js/commit/63683a4bc)
    - Renamed `Ed25519Signature` and `TransactionSignature` to `SignatureBytes` and `Signature` (#1815) [205c09268](https://github.com/solana-labs/solana-web3.js/commit/205c09268)
    - Fixed return type of `getSignaturesForAddress` (#1821) [36c7263bd](https://github.com/solana-labs/solana-web3.js/commit/36c7263bd)
    - `signTransaction` now asserts that the transaction is fully signed; added `partiallySignTransaction` that does not (#1820) [7d54c2dad](https://github.com/solana-labs/solana-web3.js/commit/7d54c2dad)
    - The `@solana/webcrypto-ed25519-polyfill` now sets the `crypto` global in Node [17a54d24a](https://github.com/solana-labs/solana-web3.js/commit/17a54d24a)
    - Added `assertIsBlockhashLifetimeTransaction` that asserts transaction has a blockhash lifetime (#1908) [ae94ca38d](https://github.com/solana-labs/solana-web3.js/commit/ae94ca38d)
    - Added a `createPrivateKeyFromBytes` helper (#1913) [85b7dfe13](https://github.com/solana-labs/solana-web3.js/commit/85b7dfe13)
    - Added `@solana/accounts`; types and helper methods for representing, fetching and decoding Solana accounts (#1855) [e1ca3966e](https://github.com/solana-labs/solana-web3.js/commit/e1ca3966e)
    - Export the TransactionError type (#1964) [4c009bf5b](https://github.com/solana-labs/solana-web3.js/commit/4c009bf5b)
    - Export all RPC method XApi types from `@solana/rpc-core` (#1965) [ed98b3d9c](https://github.com/solana-labs/solana-web3.js/commit/ed98b3d9c)
    - Added a generic `createJsonRpcApi` function for custom APIs [1e2106f21](https://github.com/solana-labs/solana-web3.js/commit/1e2106f21)
    - Added a generic `createJsonRpcSubscriptionsApi` function for custom APIs [ae3f1f087](https://github.com/solana-labs/solana-web3.js/commit/ae3f1f087)
    - RPC commitment now defaults to `confirmed` when not explicitly specified [cb7702ca5](https://github.com/solana-labs/solana-web3.js/commit/cb7702ca5)
    - Added `ClusterUrl` types and handlers (#2084) [61f7ba0](https://github.com/solana-labs/solana-web3.js/commit/61f7ba0)
    - RPC transports can now be cluster-specific, ie. `RpcDevnet<TRpcMethods>` & `RpcSubscriptionsDevnet<TRpcMethods>` (#2053) [e58bb22](https://github.com/solana-labs/solana-web3.js/commit/e58bb22), (#2056) [cbf8f38](https://github.com/solana-labs/solana-web3.js/commit/cbf8f38)
    - RPC APIs can now be cluster-specific, ie. `SolanaRpcMethodsDevnet` (#2054) [5175d8a](https://github.com/solana-labs/solana-web3.js/commit/5175d8a)
    - Added cluster-level RPC support for `@solana/web3.js` (#2055) [5a6335d](https://github.com/solana-labs/solana-web3.js/commit/5a6335d), (#2058) [0e03ca9](https://github.com/solana-labs/solana-web3.js/commit/0e03ca9)
    - Added `@solana/signers`; an abstraction layer over signing messages and transactions in Solana (#1710) [7c29a1e](https://github.com/solana-labs/solana-web3.js/commit/7c29a1e)
    - Updated codec such that only one instance of `Uint8Array` is created when encoding data. This allows `Encoders` to set data at different offsets and therefore enables non-linear serialization (#1865) [7800e3b](https://github.com/solana-labs/solana-web3.js/commit/7800e3b)
    - Added `FixedSize*` and `VariableSize*` type variants for `Codecs`, `Encoders` and `Decoders` (#1883) [5e58d5c](https://github.com/solana-labs/solana-web3.js/commit/5e58d5c)
    - Repaired some inaccurate RPC method signatures (#2137) [bb65ba9](https://github.com/solana-labs/solana-web3.js/commit/bb65ba9)
    - Renamed transaction/airdrop sender factories with the ‘Factory’ suffix (#2130) [2d1d49c](https://github.com/solana-labs/solana-web3.js/commit/2d1d49c5467e5cb13871067c3dc0f9c87f007b9f)
    - All code now throws coded exceptions defined in `@solana/errors` which can be refined using `isSolanaError()` and decoded in production using `npx @solana/errors decode` (#2160) [3524f2c](https://github.com/solana-labs/solana-web3.js/commit/3524f2c583dbc663cf6dcb73a01b0beed6cfd136), (#2161) [94944b](https://github.com/solana-labs/solana-web3.js/commit/94944b65b9d957ca95653d66dc1f4805f1a36740), (#2213) [8541c2e](https://github.com/solana-labs/solana-web3.js/commit/8541c2ef860535514fa39c4b9a6a75276417ffaa), (#2220) [c9b2705](https://github.com/solana-labs/solana-web3.js/commit/c9b2705318724bbccb05efdb1ddc088dd82921b2), (#2207) [75a18e3](https://github.com/solana-labs/solana-web3.js/commit/75a18e30524078ea1e8c07133fd6c75fad357db3), (#2224) [613053d](https://github.com/solana-labs/solana-web3.js/commit/613053deab85e5a8703e241ab138ec51cc54885a), (#2226) [94fee67](https://github.com/solana-labs/solana-web3.js/commit/94fee67560faae1f41aeddb2e7c3d0d9078ab851), (#2228) [483c674](https://github.com/solana-labs/solana-web3.js/commit/483c674a8b19f146c7dba5f1eb64182f01fdcdc4), (#2235) [803b2d8](https://github.com/solana-labs/solana-web3.js/commit/803b2d88e9e39cecf18f03b2130507dea7230423), (#2236) [cf9c20c](https://github.com/solana-labs/solana-web3.js/commit/cf9c20ceed7186f5af704ee646344c42d4ec0084), (#2242) [9084fdd](https://github.com/solana-labs/solana-web3.js/commit/9084fddec79eebb9c00c70738e43b4bfb01bf352), (#2245) [e374ac6](https://github.com/solana-labs/solana-web3.js/commit/e374ac67ad48a121470d125a1d08485b8b529b2b), (#2186) [546263e](https://github.com/solana-labs/solana-web3.js/commit/546263e251c8a7b08949b01d0d51fa2398dc7fff), (#2187) [bea19d2](https://github.com/solana-labs/solana-web3.js/commit/bea19d209ea6b02351c21a878200f87da1e9b4be), (#2188) [2e0ae95](https://github.com/solana-labs/solana-web3.js/commit/2e0ae95ffc2738ae047249c7f64c46a95e9573d1), (#2189) [7712fc3](https://github.com/solana-labs/solana-web3.js/commit/7712fc32ef33bfe7f235d85d3ba2308ba6884143), (#2190) [7d67615](https://github.com/solana-labs/solana-web3.js/commit/7d67615ac1ae771810dfc544ecc17d664a0fc11d), (#2191) [0ba8f21](https://github.com/solana-labs/solana-web3.js/commit/0ba8f216d962d61e0f653404c4a9289e59712cc2), (#2192) [91a360d](https://github.com/solana-labs/solana-web3.js/commit/91a360daf5c66ac0f1bae7347298f25ae89329b2), (#2202) [a71a2db](https://github.com/solana-labs/solana-web3.js/commit/a71a2db4c35136c8650b56985bbd33c5413e1bbd), (#2286) [52a5d3d](https://github.com/solana-labs/solana-web3.js/commit/52a5d3db60e702ccf77b4d17b8a3fd388e6e8584), and more
    - You can now supply a custom Undici dispatcher for use with the `fetch` API when creating an RPC transport in Node (#2178) [a2fc5a3](https://github.com/solana-labs/solana-web3.js/commit/a2fc5a3fda252cccc6ee62f2f7163d1578a20113)
    - Added functions to assert a value is an `IInstructionWithAccounts` and IInstructionWithData` (#2212) [07c30c1](https://github.com/solana-labs/solana-web3.js/commit/07c30c14c7d5efd6121290db62fa40371f108778)
    - Added a function to assert an instruction is for a given program (#2234) [fb655dd](https://github.com/solana-labs/solana-web3.js/commit/fb655ddd217e4c4f55c5c8a81a08177e20ef5431)
    - You can now create an RPC using only a URL (#2238) [cd0b6c6](https://github.com/solana-labs/solana-web3.js/commit/cd0b6c616ded7d1fdee33e33d3e44ce9bce48cef), (#2239) [fc11993](https://github.com/solana-labs/solana-web3.js/commit/fc119937ade7e46f487c99f254ff5a874e524c2c)
    - You can now resize codec with the `resizeCodec` helper (#2293) [606de63](https://github.com/solana-labs/solana-web3.js/commit/606de638e21eebd0535806dee445e6d046cfb074)
    - You can now skip bytes while writing byte buffers using the `offsetCodec` helper (#2294) [09d8cc8](https://github.com/solana-labs/solana-web3.js/commit/09d8cc815d133d70da0db93c9a0c0092e0d9a929)
    - You can now now pad the beginning or end of byte buffers using the `padLeftCodec` and `padRightCodec` helpers (#2314) [f9509c7](https://github.com/solana-labs/solana-web3.js/commit/f9509c77dd6ec92357edbbe18acbb76c5a33e4b2)
    - Added a new `@solana/sysvars` package for fetching, decoding, and building transactions with sysvar accounts (#2041)

- Updated dependencies [[`0546a8c`](https://github.com/solana-labs/solana-web3.js/commit/0546a8ce95b6852324d58bb32ac31480506193a7)]:
    - @solana/addresses@2.0.0-preview.2
    - @solana/errors@2.0.0-preview.2
    - @solana/instructions@2.0.0-preview.2
    - @solana/keys@2.0.0-preview.2
    - @solana/transactions@2.0.0-preview.2
