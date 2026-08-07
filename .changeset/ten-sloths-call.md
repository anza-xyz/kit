---
'@solana/plugin-interfaces': minor
---

Add a `ClientWithFetchAccounts` interface

This new plugin interface represents a client that can fetch the encoded content of accounts from their addresses via a `fetchAccounts(addresses, config?)` method. Like the other `@solana/plugin-interfaces` capabilities, it lets plugins provide or require account-fetching without coupling to a concrete RPC. The returned array matches the provided addresses in length and order, using `MaybeEncodedAccount` to represent accounts that may not exist.
