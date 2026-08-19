---
'@solana/transaction-messages': minor
---

Add support for version 1 transaction messages to `createTransactionMessage`. You can now pass `{ version: 1 }` to create an empty v1 transaction message.

This means that code using version 1 transaction messages will now type check.
