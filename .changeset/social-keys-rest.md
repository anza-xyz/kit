---
'@solana/transaction-messages': minor
'@solana/transactions': minor
'@solana/signers': minor
---

Allow transaction messages with no lifetime constraints to be compiled. Renames `TransactionFromCompilableTransactionMessage` and `SetTransactionLifetimeFromCompilableTransactionMessage` type helpers to `TransactionFromTransactionMessage` and `SetTransactionLifetimeFromTransactionMessage` respectively, to reflect that they can now be used with transaction messages that do not have a lifetime constraint.
