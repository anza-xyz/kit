---
'@solana/instruction-plans': patch
---

Add `createFailedToSendTransactionError` and `createFailedToSendTransactionsError` factory helpers that create high-level `SolanaError` instances from failed or canceled transaction plan results, with unwrapped simulation errors, preflight data, and logs in the error context.
