---
'@solana/instruction-plans': patch
---

Fix the `executeTransactionMessage` signature of the `createTransactionPlanExecutor` helper by removing the unnecessary `TTransactionMessage` type parameter.
