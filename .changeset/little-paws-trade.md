---
'@solana/instruction-plans': major
---

Add a new `planType` property to all `InstructionPlan`, `TransactionPlan`, and `TransactionPlanResult` types to distinguish them from each other at runtime. This property is a string literal with the value `'instructionPlan'`, `'transactionPlan'`, or `'transactionPlanResult'` respectively. It also adds new type guard functions that make use of that new property: `isInstructionPlan`, `isTransactionPlan`, and `isTransactionPlanResult`.

**BREAKING CHANGES**

**`InstructionPlan`, `TransactionPlan`, and `TransactionPlanResult` type guards updated.** All factories have been updated to add the new `planType` property but any custom instantiation of these types must be updated to include it as well.

```diff
  const myInstructionPlan: InstructionPlan = {
    kind: 'parallel',
    plans: [/* ... */],
+   planType: 'instructionPlan',
  };

  const myTransactionPlan: TransactionPlan = {
    kind: 'parallel',
    plans: [/* ... */],
+   planType: 'transactionPlan',
  };

  const myTransactionPlanResult: TransactionPlanResult = {
    kind: 'parallel',
    plans: [/* ... */],
+   planType: 'transactionPlanResult',
  };
```
