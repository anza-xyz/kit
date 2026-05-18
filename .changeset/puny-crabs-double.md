---
'@solana/rpc-types': minor
---

`Base58EncodedBytes`, `Base64EncodedBytes`, and `Base64EncodedZStdCompressedBytes` are no longer uniquely branded. They are now plain `EncodedString<...>` aliases over their respective encoding tags. As a result, any value that already carries the matching encoding tag (such as `Address`, `Signature`, or `Blockhash` for base 58) can be used wherever `Base58EncodedBytes` is expected. For example, an `Address` may now be passed directly as the `bytes` of a `memcmp` filter in `getProgramAccounts`. The runtime representation is unchanged and existing call sites continue to compile without modification.
