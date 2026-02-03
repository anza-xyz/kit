---
'@solana/instruction-plans': major
---

Remove deprecated function `getAllSingleTransactionPlans`

**BREAKING CHANGES**

**`getAllSingleTransactionPlans` removed.** Use `flattenTransactionPlan` instead.

```diff
- const singlePlans = getAllSingleTransactionPlans(transactionPlan);
+ const singlePlans = flattenTransactionPlan(transactionPlan);
```
