---
'@solana/rpc-api': patch
---

Stop upcasting transaction `version` to `bigint`

The response transformer upcasts every JSON integer to a `bigint` unless its keypath appears in an allow-list. `version` was missing from that allow-list on `getTransaction`, `getBlock` transactions, and `getTransactionsForAddress`, so it arrived at runtime as `0n` while still typechecking as `TransactionVersion` (`'legacy' | 0 | 1`).

A check like `if (transaction.version === 0)` therefore compiled cleanly and was always false, with no compiler error and no runtime error. The keypath is now allow-listed and `version` arrives as a number, matching its declared type.
