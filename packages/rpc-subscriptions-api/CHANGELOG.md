# @solana/rpc-subscriptions-api

## 2.3.0

### Patch Changes

- Updated dependencies [[`6ccbf01`](https://github.com/anza-xyz/kit/commit/6ccbf012703fce1cb40388b0f4e1ffaeffea838a), [`53e1336`](https://github.com/anza-xyz/kit/commit/53e1336149878c84048e0fde5c7e7ace6cc1e97f), [`eb61d94`](https://github.com/anza-xyz/kit/commit/eb61d94786e212fc23778d445a94b86d2b1b024f), [`bbcb913`](https://github.com/anza-xyz/kit/commit/bbcb913839d33abc746f38d6e65e7bfd30cd2ac6), [`304a44f`](https://github.com/anza-xyz/kit/commit/304a44fc68401001af45b1088eea825d8f437677), [`93609aa`](https://github.com/anza-xyz/kit/commit/93609aa31dbd83086d0debd41aa2f8e9a0809761), [`b7dfe03`](https://github.com/anza-xyz/kit/commit/b7dfe033a8e929d7a598d8bfea546e9ef4207639), [`e6c0568`](https://github.com/anza-xyz/kit/commit/e6c0568ef34fdc04075af27eb102851123a02be0), [`810d6ab`](https://github.com/anza-xyz/kit/commit/810d6abafe1b7ea46ed63c491db1f5d6c16397ab)]:
    - @solana/transaction-messages@2.3.0
    - @solana/transactions@2.3.0
    - @solana/rpc-subscriptions-spec@2.3.0
    - @solana/addresses@2.3.0
    - @solana/keys@2.3.0
    - @solana/rpc-transformers@2.3.0
    - @solana/rpc-types@2.3.0

## 2.2.1

### Patch Changes

- Updated dependencies [[`e881fca`](https://github.com/anza-xyz/kit/commit/e881fca9ea0154d0eeaec682697042f86502b86d)]:
    - @solana/rpc-subscriptions-spec@2.2.1
    - @solana/addresses@2.2.1
    - @solana/keys@2.2.1
    - @solana/rpc-transformers@2.2.1
    - @solana/rpc-types@2.2.1
    - @solana/transaction-messages@2.2.1
    - @solana/transactions@2.2.1

## 2.2.0

### Patch Changes

- Updated dependencies [[`85925d6`](https://github.com/anza-xyz/kit/commit/85925d64308e91b59fb748c75e4b414012eb4893)]:
    - @solana/addresses@2.2.0
    - @solana/keys@2.2.0
    - @solana/rpc-transformers@2.2.0
    - @solana/rpc-types@2.2.0
    - @solana/transaction-messages@2.2.0
    - @solana/transactions@2.2.0
    - @solana/rpc-subscriptions-spec@2.2.0

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

- Updated dependencies [[`7e7b2ef`](https://github.com/anza-xyz/kit/commit/7e7b2efebfd8de431e4381cc3d3fa117d3228030), [`36a9dee`](https://github.com/anza-xyz/kit/commit/36a9dee4e6cbd72020dc74777fe394130b9a5f46), [`41b679c`](https://github.com/anza-xyz/kit/commit/41b679c2646029c9c7f005de55fba687e3c89e8a), [`41b679c`](https://github.com/anza-xyz/kit/commit/41b679c2646029c9c7f005de55fba687e3c89e8a), [`776e18d`](https://github.com/anza-xyz/kit/commit/776e18d75c759a839608069c61da3f70b775540b), [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2)]:
    - @solana/rpc-transformers@2.1.1
    - @solana/rpc-subscriptions-spec@2.1.1
    - @solana/transaction-messages@2.1.1
    - @solana/transactions@2.1.1
    - @solana/addresses@2.1.1
    - @solana/rpc-types@2.1.1
    - @solana/keys@2.1.1

## 2.1.0

### Patch Changes

- Updated dependencies [[`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d), [`d1c787c`](https://github.com/anza-xyz/kit/commit/d1c787c447bd134e6a6da8be059c8353f92b2f9a), [`0c577eb`](https://github.com/anza-xyz/kit/commit/0c577eb03fa5db8b817f209d52a19a36976c7c12), [`9b179dc`](https://github.com/anza-xyz/kit/commit/9b179dc6b7c7e6e4d51481a396567f17665abbc3), [`29d1e28`](https://github.com/anza-xyz/kit/commit/29d1e282f7ae53db008515980f13d54c40760065), [`400f4d5`](https://github.com/anza-xyz/kit/commit/400f4d5673286a197561033bba63bac9a433cc6a), [`704d8a2`](https://github.com/anza-xyz/kit/commit/704d8a220592a5a472bd7726013814b50c991f5b)]:
    - @solana/addresses@2.1.0
    - @solana/keys@2.1.0
    - @solana/rpc-types@2.1.0
    - @solana/rpc-subscriptions-spec@2.1.0
    - @solana/transaction-messages@2.1.0
    - @solana/transactions@2.1.0
    - @solana/rpc-transformers@2.1.0

## 2.0.0

### Patch Changes

- [#3218](https://github.com/solana-labs/solana-web3.js/pull/3218) [`1d87b3c`](https://github.com/solana-labs/solana-web3.js/commit/1d87b3c9fb5637cdceb31c5675e876d8fe088677) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Clean up SolanaRpcSubscriptionsApi: no longer extend RpcApiSubscriptionsMethods

- [#3407](https://github.com/solana-labs/solana-web3.js/pull/3407) [`10b08ac`](https://github.com/solana-labs/solana-web3.js/commit/10b08ac8cdb61aa1412475426cfcaf0eefe32722) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `RpcRequest`, `RpcResponse` and their transformers in RPC Subscriptions packages

    This change makes the RPC and RPC Subscriptions architecture more consistent by using the same `RpcRequest` and `RpcResponse` types and transformers as the basis for handling user requests (RPC calls or subscriptions) and returning responses to them.

    See the following PRs for more details:
    - [PR #3393](https://github.com/solana-labs/solana-web3.js/pull/3393)
    - [PR #3394](https://github.com/solana-labs/solana-web3.js/pull/3394)
    - [PR #3403](https://github.com/solana-labs/solana-web3.js/pull/3403)
    - [PR #3404](https://github.com/solana-labs/solana-web3.js/pull/3404)
    - [PR #3405](https://github.com/solana-labs/solana-web3.js/pull/3405)

- [#3150](https://github.com/solana-labs/solana-web3.js/pull/3150) [`a705413`](https://github.com/solana-labs/solana-web3.js/commit/a705413e357fb5c5907c5fc1df17d241bc5c0f76) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Make `RpcApi` use new `RpcRequestTransformer` and `RpcResponseTransformer`

- [#3541](https://github.com/solana-labs/solana-web3.js/pull/3541) [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Drop the Release Candidate label and publish `@solana/web3.js` at version 2.0.0

- [#3134](https://github.com/solana-labs/solana-web3.js/pull/3134) [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823) Thanks [@buffalojoec](https://github.com/buffalojoec)! - Change unix timestamp type to bigint with an unsafe label

- [#3406](https://github.com/solana-labs/solana-web3.js/pull/3406) [`4c7224d`](https://github.com/solana-labs/solana-web3.js/commit/4c7224d0a884b0dc91ea536ce5fbdcd0a0d7e011) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace subscriptionConfigurationHash with RpcRequest in RpcSubscriptionPlan

- [#2606](https://github.com/solana-labs/solana-web3.js/pull/2606) [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use commonjs package type

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

- [`c8e6e71`](https://github.com/solana-labs/solana-web3.js/commit/c8e6e71529f219caf83ed444e53f5a1e757129dc) Thanks [@steveluscher](https://github.com/steveluscher)! - We refactored the lower levels of the subscriptions API entirely.

    Previously, all layers of the subscriptions implementation, from the `WebSocket` transport to the API that developers use, dealt in `AsyncIterables`. These are notoriously difficult to code in such a way that expresses all of the ways in which a subscription might be cancelled or error out. Very slight omissions of care could open memory leaks that would bring down the simplest of apps. The new subscriptions infra in Release Candidate 2 deals with event-based subscriptions all the way up to the highest level API, at which point the subscription is vended to the application as an `AsyncIterable`.

    This has eliminated several classes of memory leak and has made it easier to implement higher-level transports (like the autopinger and the subscription coalescer). Additionally, this update introduces a new channel pool implementation that opens new `WebSocket` connections when existing ones become ‘full.’ Lastly, performance in the new implementation has been improved through a new demultiplexing utility that can separate `message` events into several channels based on arbitrary criteria, meaning you can apply transforms to the message right at the source, and vend subscriptions to downstream consumers that care only about one particular kind of message.

- Updated dependencies [[`1d87b3c`](https://github.com/solana-labs/solana-web3.js/commit/1d87b3c9fb5637cdceb31c5675e876d8fe088677), [`31916ae`](https://github.com/solana-labs/solana-web3.js/commit/31916ae5d4fb29f239c63252a59745e33a6979ea), [`292487d`](https://github.com/solana-labs/solana-web3.js/commit/292487da00ee57350e8faf49ccf961203aed6403), [`10b08ac`](https://github.com/solana-labs/solana-web3.js/commit/10b08ac8cdb61aa1412475426cfcaf0eefe32722), [`7d310f6`](https://github.com/solana-labs/solana-web3.js/commit/7d310f6f9cd7d02fca4d6f8e311b857c9dd84e61), [`3834d82`](https://github.com/solana-labs/solana-web3.js/commit/3834d82eb1dd150f261612d742c3105194689c13), [`419c12e`](https://github.com/solana-labs/solana-web3.js/commit/419c12e617435570d0cded6ca6d35370d0060da7), [`9dfca45`](https://github.com/solana-labs/solana-web3.js/commit/9dfca454355819444bad29e48602886428ba4cac), [`1c25dd4`](https://github.com/solana-labs/solana-web3.js/commit/1c25dd4069a3a8f5599285c9b0eaeb71a2f897d1), [`002cc38`](https://github.com/solana-labs/solana-web3.js/commit/002cc38a99cd4c91c7ce9023e1b4fb28f7e10832), [`17c373d`](https://github.com/solana-labs/solana-web3.js/commit/17c373dec6dd167ea5b4e37e213067aa05fa4e14), [`29d5113`](https://github.com/solana-labs/solana-web3.js/commit/29d5113b2c6f8c7907127ad992bad1329edbd7e7), [`0245265`](https://github.com/solana-labs/solana-web3.js/commit/024526554fa0145e31e62a0d47f1eea556a30e71), [`29821df`](https://github.com/solana-labs/solana-web3.js/commit/29821df246b14eb41dd4606913f44fac40183957), [`a705413`](https://github.com/solana-labs/solana-web3.js/commit/a705413e357fb5c5907c5fc1df17d241bc5c0f76), [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4), [`9dfca45`](https://github.com/solana-labs/solana-web3.js/commit/9dfca454355819444bad29e48602886428ba4cac), [`747b9ab`](https://github.com/solana-labs/solana-web3.js/commit/747b9abb90c6baeec73a284d87a324bf3caeab03), [`231a030`](https://github.com/solana-labs/solana-web3.js/commit/231a0303ae5960e783719a8ff1d17a50ff26ad78), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`73bd5a9`](https://github.com/solana-labs/solana-web3.js/commit/73bd5a9e0b32846cd5d76f2d2d1b21661eab0677), [`2e5af9f`](https://github.com/solana-labs/solana-web3.js/commit/2e5af9f1a9410f15108863342b48225fdf9a0c83), [`e3e82d9`](https://github.com/solana-labs/solana-web3.js/commit/e3e82d909825e958ae234ed18500335a621773bd), [`4c7224d`](https://github.com/solana-labs/solana-web3.js/commit/4c7224d0a884b0dc91ea536ce5fbdcd0a0d7e011), [`54d68c4`](https://github.com/solana-labs/solana-web3.js/commit/54d68c482feebf4e62a9896b3badd77dab615941), [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147), [`28ca5d1`](https://github.com/solana-labs/solana-web3.js/commit/28ca5d17d4c574a690a5bf29d4f1fe0ad8f5883c), [`3d90241`](https://github.com/solana-labs/solana-web3.js/commit/3d902419c1b232fa7145757b9c95976de69790c7), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b), [`c801637`](https://github.com/solana-labs/solana-web3.js/commit/c801637bcf94930be832c57817166da2d2fdb1a4), [`92655fd`](https://github.com/solana-labs/solana-web3.js/commit/92655fda6631339f07c6cd7097ed9e2518f86853), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a), [`0158b31`](https://github.com/solana-labs/solana-web3.js/commit/0158b3181ed96996f269f3bff689f76411e460b3), [`db144da`](https://github.com/solana-labs/solana-web3.js/commit/db144da362e3389837b56f97abfb766cc8c847c2), [`f9a8446`](https://github.com/solana-labs/solana-web3.js/commit/f9a84460670a97d4ab6514b28fe0d29c6fac3302), [`c8e6e71`](https://github.com/solana-labs/solana-web3.js/commit/c8e6e71529f219caf83ed444e53f5a1e757129dc), [`125fc15`](https://github.com/solana-labs/solana-web3.js/commit/125fc1540cfbc0a4afdba5aabac0884c750e58c1)]:
    - @solana/rpc-subscriptions-spec@2.0.0
    - @solana/transactions@2.0.0
    - @solana/addresses@2.0.0
    - @solana/rpc-types@2.0.0
    - @solana/rpc-transformers@2.0.0
    - @solana/keys@2.0.0
    - @solana/transaction-messages@2.0.0

## 2.0.0-rc.4

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@2.0.0-rc.4
    - @solana/keys@2.0.0-rc.4
    - @solana/rpc-subscriptions-spec@2.0.0-rc.4
    - @solana/rpc-transformers@2.0.0-rc.4
    - @solana/rpc-types@2.0.0-rc.4
    - @solana/transaction-messages@2.0.0-rc.4
    - @solana/transactions@2.0.0-rc.4

## 2.0.0-rc.3

### Patch Changes

- Updated dependencies []:
    - @solana/rpc-subscriptions-spec@2.0.0-rc.3
    - @solana/rpc-transformers@2.0.0-rc.3
    - @solana/addresses@2.0.0-rc.3
    - @solana/keys@2.0.0-rc.3
    - @solana/rpc-types@2.0.0-rc.3
    - @solana/transaction-messages@2.0.0-rc.3
    - @solana/transactions@2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- [#3218](https://github.com/solana-labs/solana-web3.js/pull/3218) [`1d87b3c`](https://github.com/solana-labs/solana-web3.js/commit/1d87b3c9fb5637cdceb31c5675e876d8fe088677) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Clean up SolanaRpcSubscriptionsApi: no longer extend RpcApiSubscriptionsMethods

- [#3407](https://github.com/solana-labs/solana-web3.js/pull/3407) [`10b08ac`](https://github.com/solana-labs/solana-web3.js/commit/10b08ac8cdb61aa1412475426cfcaf0eefe32722) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `RpcRequest`, `RpcResponse` and their transformers in RPC Subscriptions packages

    This change makes the RPC and RPC Subscriptions architecture more consistent by using the same `RpcRequest` and `RpcResponse` types and transformers as the basis for handling user requests (RPC calls or subscriptions) and returning responses to them.

    See the following PRs for more details:
    - [PR #3393](https://github.com/solana-labs/solana-web3.js/pull/3393)
    - [PR #3394](https://github.com/solana-labs/solana-web3.js/pull/3394)
    - [PR #3403](https://github.com/solana-labs/solana-web3.js/pull/3403)
    - [PR #3404](https://github.com/solana-labs/solana-web3.js/pull/3404)
    - [PR #3405](https://github.com/solana-labs/solana-web3.js/pull/3405)

- [#3150](https://github.com/solana-labs/solana-web3.js/pull/3150) [`a705413`](https://github.com/solana-labs/solana-web3.js/commit/a705413e357fb5c5907c5fc1df17d241bc5c0f76) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Make `RpcApi` use new `RpcRequestTransformer` and `RpcResponseTransformer`

- [#3134](https://github.com/solana-labs/solana-web3.js/pull/3134) [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823) Thanks [@buffalojoec](https://github.com/buffalojoec)! - Change unix timestamp type to bigint with an unsafe label

- [#3406](https://github.com/solana-labs/solana-web3.js/pull/3406) [`4c7224d`](https://github.com/solana-labs/solana-web3.js/commit/4c7224d0a884b0dc91ea536ce5fbdcd0a0d7e011) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace subscriptionConfigurationHash with RpcRequest in RpcSubscriptionPlan

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

- [`c8e6e71`](https://github.com/solana-labs/solana-web3.js/commit/c8e6e71529f219caf83ed444e53f5a1e757129dc) Thanks [@steveluscher](https://github.com/steveluscher)! - We refactored the lower levels of the subscriptions API entirely.

    Previously, all layers of the subscriptions implementation, from the `WebSocket` transport to the API that developers use, dealt in `AsyncIterables`. These are notoriously difficult to code in such a way that expresses all of the ways in which a subscription might be cancelled or error out. Very slight omissions of care could open memory leaks that would bring down the simplest of apps. The new subscriptions infra in Release Candidate 2 deals with event-based subscriptions all the way up to the highest level API, at which point the subscription is vended to the application as an `AsyncIterable`.

    This has eliminated several classes of memory leak and has made it easier to implement higher-level transports (like the autopinger and the subscription coalescer). Additionally, this update introduces a new channel pool implementation that opens new `WebSocket` connections when existing ones become ‘full.’ Lastly, performance in the new implementation has been improved through a new demultiplexing utility that can separate `message` events into several channels based on arbitrary criteria, meaning you can apply transforms to the message right at the source, and vend subscriptions to downstream consumers that care only about one particular kind of message.

- Updated dependencies [[`1d87b3c`](https://github.com/solana-labs/solana-web3.js/commit/1d87b3c9fb5637cdceb31c5675e876d8fe088677), [`292487d`](https://github.com/solana-labs/solana-web3.js/commit/292487da00ee57350e8faf49ccf961203aed6403), [`10b08ac`](https://github.com/solana-labs/solana-web3.js/commit/10b08ac8cdb61aa1412475426cfcaf0eefe32722), [`3834d82`](https://github.com/solana-labs/solana-web3.js/commit/3834d82eb1dd150f261612d742c3105194689c13), [`9dfca45`](https://github.com/solana-labs/solana-web3.js/commit/9dfca454355819444bad29e48602886428ba4cac), [`1c25dd4`](https://github.com/solana-labs/solana-web3.js/commit/1c25dd4069a3a8f5599285c9b0eaeb71a2f897d1), [`17c373d`](https://github.com/solana-labs/solana-web3.js/commit/17c373dec6dd167ea5b4e37e213067aa05fa4e14), [`29d5113`](https://github.com/solana-labs/solana-web3.js/commit/29d5113b2c6f8c7907127ad992bad1329edbd7e7), [`0245265`](https://github.com/solana-labs/solana-web3.js/commit/024526554fa0145e31e62a0d47f1eea556a30e71), [`a705413`](https://github.com/solana-labs/solana-web3.js/commit/a705413e357fb5c5907c5fc1df17d241bc5c0f76), [`9dfca45`](https://github.com/solana-labs/solana-web3.js/commit/9dfca454355819444bad29e48602886428ba4cac), [`747b9ab`](https://github.com/solana-labs/solana-web3.js/commit/747b9abb90c6baeec73a284d87a324bf3caeab03), [`231a030`](https://github.com/solana-labs/solana-web3.js/commit/231a0303ae5960e783719a8ff1d17a50ff26ad78), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`4c7224d`](https://github.com/solana-labs/solana-web3.js/commit/4c7224d0a884b0dc91ea536ce5fbdcd0a0d7e011), [`28ca5d1`](https://github.com/solana-labs/solana-web3.js/commit/28ca5d17d4c574a690a5bf29d4f1fe0ad8f5883c), [`92655fd`](https://github.com/solana-labs/solana-web3.js/commit/92655fda6631339f07c6cd7097ed9e2518f86853), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a), [`0158b31`](https://github.com/solana-labs/solana-web3.js/commit/0158b3181ed96996f269f3bff689f76411e460b3), [`db144da`](https://github.com/solana-labs/solana-web3.js/commit/db144da362e3389837b56f97abfb766cc8c847c2), [`c8e6e71`](https://github.com/solana-labs/solana-web3.js/commit/c8e6e71529f219caf83ed444e53f5a1e757129dc)]:
    - @solana/rpc-subscriptions-spec@2.0.0-rc.2
    - @solana/addresses@2.0.0-rc.2
    - @solana/rpc-transformers@2.0.0-rc.2
    - @solana/rpc-types@2.0.0-rc.2
    - @solana/transaction-messages@2.0.0-rc.2
    - @solana/transactions@2.0.0-rc.2
    - @solana/keys@2.0.0-rc.2

## 2.0.0-rc.1

### Patch Changes

- Updated dependencies [[`7d310f6`](https://github.com/solana-labs/solana-web3.js/commit/7d310f6f9cd7d02fca4d6f8e311b857c9dd84e61), [`f9a8446`](https://github.com/solana-labs/solana-web3.js/commit/f9a84460670a97d4ab6514b28fe0d29c6fac3302)]:
    - @solana/keys@2.0.0-rc.1
    - @solana/transactions@2.0.0-rc.1
    - @solana/addresses@2.0.0-rc.1
    - @solana/rpc-subscriptions-spec@2.0.0-rc.1
    - @solana/rpc-transformers@2.0.0-rc.1
    - @solana/rpc-types@2.0.0-rc.1
    - @solana/transaction-messages@2.0.0-rc.1

## 2.0.0-rc.0

### Patch Changes

- Updated dependencies [[`419c12e`](https://github.com/solana-labs/solana-web3.js/commit/419c12e617435570d0cded6ca6d35370d0060da7), [`29821df`](https://github.com/solana-labs/solana-web3.js/commit/29821df246b14eb41dd4606913f44fac40183957)]:
    - @solana/transaction-messages@2.0.0-rc.0
    - @solana/rpc-transformers@2.0.0-rc.0
    - @solana/transactions@2.0.0-rc.0
    - @solana/addresses@2.0.0-rc.0
    - @solana/keys@2.0.0-rc.0
    - @solana/rpc-subscriptions-spec@2.0.0-rc.0
    - @solana/rpc-types@2.0.0-rc.0

## 2.0.0-preview.4

### Patch Changes

- [#2606](https://github.com/solana-labs/solana-web3.js/pull/2606) [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use commonjs package type

- Updated dependencies [[`73bd5a9`](https://github.com/solana-labs/solana-web3.js/commit/73bd5a9e0b32846cd5d76f2d2d1b21661eab0677), [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147), [`3d90241`](https://github.com/solana-labs/solana-web3.js/commit/3d902419c1b232fa7145757b9c95976de69790c7), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b)]:
    - @solana/rpc-types@2.0.0-preview.4
    - @solana/keys@2.0.0-preview.4
    - @solana/transaction-messages@2.0.0-preview.4
    - @solana/rpc-subscriptions-spec@2.0.0-preview.4
    - @solana/rpc-transformers@2.0.0-preview.4
    - @solana/transactions@2.0.0-preview.4
    - @solana/addresses@2.0.0-preview.4

## 2.0.0-preview.3

### Patch Changes

- Updated dependencies [[`31916ae`](https://github.com/solana-labs/solana-web3.js/commit/31916ae5d4fb29f239c63252a59745e33a6979ea), [`002cc38`](https://github.com/solana-labs/solana-web3.js/commit/002cc38a99cd4c91c7ce9023e1b4fb28f7e10832), [`2e5af9f`](https://github.com/solana-labs/solana-web3.js/commit/2e5af9f1a9410f15108863342b48225fdf9a0c83), [`e3e82d9`](https://github.com/solana-labs/solana-web3.js/commit/e3e82d909825e958ae234ed18500335a621773bd), [`54d68c4`](https://github.com/solana-labs/solana-web3.js/commit/54d68c482feebf4e62a9896b3badd77dab615941), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`c801637`](https://github.com/solana-labs/solana-web3.js/commit/c801637bcf94930be832c57817166da2d2fdb1a4), [`125fc15`](https://github.com/solana-labs/solana-web3.js/commit/125fc1540cfbc0a4afdba5aabac0884c750e58c1)]:
    - @solana/transactions@2.0.0-preview.3
    - @solana/addresses@2.0.0-preview.3
    - @solana/rpc-types@2.0.0-preview.3
    - @solana/transaction-messages@2.0.0-preview.3
    - @solana/keys@2.0.0-preview.3
    - @solana/rpc-transformers@2.0.0-preview.3
    - @solana/rpc-subscriptions-spec@2.0.0-preview.3

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
    - @solana/keys@2.0.0-preview.2
    - @solana/rpc-subscriptions-spec@2.0.0-preview.2
    - @solana/rpc-transformers@2.0.0-preview.2
    - @solana/rpc-types@2.0.0-preview.2
    - @solana/transactions@2.0.0-preview.2
