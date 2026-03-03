---
'@solana/errors': patch
'@solana/instruction-plans': patch
---

Add `errors` and `errorsList` to the `FAILED_TO_EXECUTE_TRANSACTION_PLAN` error context and include a formatted list of failed transactions in the error message. Extract error construction into a public `createFailedToExecuteTransactionPlanError` function for use by custom executors.
