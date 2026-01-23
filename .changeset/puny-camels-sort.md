---
'@solana/instruction-plans': minor
---

Add `passthroughFailedTransactionPlanExecution` helper function that wraps a transaction plan execution promise to return a `TransactionPlanResult` even on execution failure. This allows handling execution results in a unified way without try/catch.
