---
'@solana/rpc-api': minor
---

Add the optional `transactionIndex` field to each element of the `getSignaturesForAddress` response. Agave 4.0 (anza-xyz/agave#9683) included the 0 based transaction index inside the block alongside each returned signature. The field is omitted by older RPC servers, so the new property is optional and existing call sites continue to compile without modification.
