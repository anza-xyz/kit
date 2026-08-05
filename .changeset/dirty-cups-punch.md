---
'@solana/instruction-plans': minor
---

Added `TransactionPlanExecutorWithTransactions` and `TransactionPlanExecutorConfigWithTransactions`, the latter of which `createTransactionPlanExecutor` now accepts to infer the former for an executor whose `executeTransactionMessage` returns a transaction rather than a signature, so that the guarantee that every successful result carries its transaction survives the executor boundary.
