---
'@solana/instruction-plans': minor
---

Align `createTransactionPlanExecutorWithConcurrentLeaves` with `createTransactionPlanExecutor` by giving both the same `TransactionPlanExecutorConfig`. Its `executeTransactionMessage` callback now receives a mutable per-leaf `context` object and returns the context of a successful result, instead of building a whole `SingleTransactionPlanResult` itself. The executor builds the results: on success it merges the returned context over the stored one, and when the callback throws — or the abort signal fires before it settles — it preserves the stored context on the failed result, matching the partial-context behaviour of `createTransactionPlanExecutor`. The `ConcurrentLeafTransactionPlanExecutorConfig` type is removed. This is a breaking change to the `createTransactionPlanExecutorWithConcurrentLeaves` API introduced in 8.1.0.
