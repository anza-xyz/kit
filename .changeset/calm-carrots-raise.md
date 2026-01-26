---
'@solana/instruction-plans': minor
---

Add `flattenInstructionPlan` and `flattenTransactionPlan` functions, that can be used to remove the sequential/parallel structure from these plans. Deprecate `getAllSingleTransactionPlans` which is superseded by `flattenTransactionPlan`.
