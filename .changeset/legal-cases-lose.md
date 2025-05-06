---
'@solana/rpc-subscriptions-channel-websocket': patch
'@solana/webcrypto-ed25519-polyfill': patch
'@solana/transaction-confirmation': patch
'@solana/codecs-data-structures': patch
'@solana/rpc-subscriptions-spec': patch
'@solana/fast-stable-stringify': patch
'@solana/rpc-subscriptions-api': patch
'@solana/transaction-messages': patch
'@solana/rpc-transport-http': patch
'@solana/rpc-subscriptions': patch
'@solana/rpc-parsed-types': patch
'@solana/rpc-transformers': patch
'@solana/codecs-numbers': patch
'@solana/codecs-strings': patch
'@solana/rpc-spec-types': patch
'@solana/nominal-types': patch
'@solana/instructions': patch
'@solana/subscribable': patch
'@solana/transactions': patch
'@solana/codecs-core': patch
'@solana/rpc-graphql': patch
'@solana/assertions': patch
'@solana/functional': patch
'@solana/addresses': patch
'@solana/rpc-types': patch
'@solana/accounts': patch
'@solana/programs': patch
'@solana/promises': patch
'@solana/rpc-spec': patch
'@solana/options': patch
'@solana/rpc-api': patch
'@solana/signers': patch
'@solana/sysvars': patch
'@solana/codecs': patch
'@solana/compat': patch
'@solana/errors': patch
'@solana/react': patch
'@solana/keys': patch
'@solana/kit': patch
'@solana/rpc': patch
---

The identity of all branded types has changed in such a way that the types from v2.1.1 will be compatible with any other version going forward, which is not the case for versions v2.1.0 and before.

If you end up with a mix of versions in your project prior to v2.1.1 (eg. `@solana/addresses@2.0.0` and `@solana/addresses@2.1.0`) you may discover that branded types like `Address` raise a type error, even though they are runtime compatible. Your options are:

1. Always make sure that you have exactly one instance of each `@solana/*` dependency in your project at any given time
2. Upgrade all of your `@solana/*` dependencies to v2.1.1 at minimum, even if their minor or patch versions differ.
3. Suppress the type errors using a comment like the following:
    ```ts
    const myAddress = address('1234..5678');     // from @solana/addresses@2.0.0
    const myAccount = await fetchEncodedAccount( // imports @solana/addresses@2.1.0
        rpc,
        // @ts-expect-error Address types mismatch between installed versions of @solana/addresses
        myAddress,
    );
    ```
