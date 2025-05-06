---
'@solana/transactions': major
'@solana/signers': major
'@solana/kit': major
---

BREAKING CHANGE: The `FullySignedTransaction` no longer extends the `Transaction` type so it can be composed with other flags that also narrow transaction types. This means, whenever `FullySignedTransaction` is used on its own, it will need to be replaced with `FullySignedTransaction & Transaction`.
