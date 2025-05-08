---
'@solana/transactions': major
'@solana/kit': major
---

BREAKING CHANGE: Transactions must now satisfy the `SendableTransaction` type before being provided to helper functions that send transactions to the network. On top of ensuring the transaction is fully signed, this type also ensures the transaction is within size limit.
