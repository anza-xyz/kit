---
'@solana/transaction-messages': minor
'@solana/addresses': minor
---

Add a new `HasAddress` type representing any object exposing a Solana address through an `address` property — e.g. a `TransactionSigner`, an `AccountMeta` or a framework's address wrapper class. The fee payer of a transaction message is now typed using `HasAddress` (a structurally identical change).
