---
'@solana/instruction-plans': patch
---

Fix the `onTransactionMessageUpdated` signature of the `createTransactionPlanner` helper by removing the unnecessary `TTransactionMessage` type parameter.
