---
"@solana/transaction-messages": patch
---

`compressTransactionMessageUsingAddressLookupTables()` will no longer convert an account to a lookup table account, if the address of that account is used as a program address anywhere in the transaction.
