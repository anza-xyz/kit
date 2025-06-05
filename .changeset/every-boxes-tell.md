---
'@solana/transaction-messages': patch
---

Add provisory blockhash lifetime helpers to use as placeholders when constructing transaction messages. Namely, it adds the `PROVISORY_BLOCKHASH_LIFETIME_CONSTRAINT` constant and the `fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash` and `setTransactionMessageLifetimeUsingProvisoryBlockhash` functions.
