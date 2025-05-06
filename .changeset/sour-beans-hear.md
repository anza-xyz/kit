---
'@solana/transactions': minor
'@solana/signers': minor
'@solana/kit': minor
---

The `FullySignedTransaction` no longer extends the `Transaction` type so it can be composed with other flags that also narrow transaction types.
