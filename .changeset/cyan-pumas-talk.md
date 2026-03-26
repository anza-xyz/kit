---
'@solana/instruction-plans': minor
'@solana/transactions': minor
---

Add version-aware transaction size limits. Version 1 transactions now allow up to 4096 bytes, while legacy and v0 transactions continue to use the existing 1232-byte limit. Two new helper functions are exported from `@solana/transactions`: `getTransactionSizeLimit` for compiled `Transaction` objects, and `getTransactionMessageSizeLimit` for `TransactionMessage` objects. 

The existing `TRANSACTION_SIZE_LIMIT`, `TRANSACTION_PACKET_SIZE`, and `TRANSACTION_PACKET_HEADER` constants are now deprecated in favour of `getTransactionSizeLimit` and will be removed in a future major version.
