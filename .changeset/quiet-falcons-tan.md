---
'@solana/errors': minor
'@solana/instruction-plans': minor
---

Added `SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTION` and `SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTIONS`, along with `createFailedToSignTransactionError` and `createFailedToSignTransactionsError`, so that a plugin signing transactions without sending them can report failures as accurately as sending does.
