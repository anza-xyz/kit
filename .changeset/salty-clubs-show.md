---
'@solana/instruction-plans': major
---

Let `TContext` decide what a transaction plan result context contains

The context attached to a transaction plan result was never entirely controlled by the executor. `SuccessfulSingleTransactionPlanResult` hardcoded it as `SuccessfulBaseTransactionPlanResultContext & TContext`, and `createTransactionPlanExecutor` mixed further properties into both the callback's context and the executor's result type. Because intersections only ever narrow, no choice of `TContext` could relax the required `signature` — which made it impossible to type an executor that partially signs transactions for a relayer to submit later.

`TContext` is now the only thing that says what a context contains. The signature guarantee moved out of the *structure* of the result types and into the *default* value of `TContext`, so every zero-type-argument spelling behaves exactly as it did before.

**A new context type.** `TransactionPlanResultContextWithSignature` guarantees a `signature` and is the new default everywhere. `SuccessfulBaseTransactionPlanResultContext` is deprecated in favour of it.

**Explicit context types must be migrated.** Intersect the new default to keep the signature guarantee:

```diff
- SingleTransactionPlanResult<{ startedAt: number }>
+ SingleTransactionPlanResult<TransactionPlanResultContextWithSignature & { startedAt: number }>
```

**The executor callback now receives `Partial<TContext>`.** A fresh, empty context is created for every transaction message and filling it in is the callback's job, but its properties used to be typed as required — so a callback could read one before writing it, be told a value was there, and get `undefined` at runtime. Everything is optional on entry now. Writing still narrows, so a read after `context.custom = 'value'` gives the non-optional type.

One consequence is that a callback can no longer annotate its own parameter with required properties, which was a common way to infer a custom context. Use a type argument instead:

```diff
- createTransactionPlanExecutor({
-     executeTransactionMessage: async (context: { startedAt: number }) => { /* ... */ },
- })
+ createTransactionPlanExecutor<TransactionPlanResultContextWithSignature & { startedAt: number }>({
+     executeTransactionMessage: async context => { /* ... */ },
+ })
```

**A returned context no longer has to carry a `signature`.** The `executeTransactionMessage` callback may return the context that a successful result should carry, and that context used to need a signature because the result type hardcoded one. `TContext` decides now: the default still requires it, and a custom `TContext` that omits it is accepted — which is what makes the relayer case above expressible end to end, rather than merely possible at runtime. Consequently the executor no longer tells a returned context apart from a returned `Transaction` by looking for a `signature` on it, since a context may not have one; it looks for the `signatures` map that only a `Transaction` has.

**Failed and canceled results type their context as `Readonly<Partial<TContext>>`.** Those branches never guaranteed custom properties at runtime — the context is built incrementally and the callback may throw at any point — so the types now say so.

**Inference from object literals is narrower**, since the result constructors no longer add properties you did not pass. `successfulSingleTransactionPlanResult(message, { signature })` infers `Readonly<{ signature: Signature }>` rather than a context that also carried optional `message` and `transaction` fields plus an index signature, so reading `result.context.message` off it is now an error. On the failed and canceled constructors the `Partial` goes further: even a field you did pass comes back optional, so `failedSingleTransactionPlanResult(message, error, { transaction }).context.transaction` is `Transaction | undefined`. Pass an explicit type argument wherever you need a field to type as required. Relatedly, `successfulSingleTransactionPlanResultFromTransaction`'s optional `context` parameter changes from `Omit<BaseTransactionPlanResultContext, 'signature' | 'transaction'> & TContext` to `TContext`; `signature` and `transaction` are still derived from the `transaction` argument and intersected into the result's context type.

**Helpers that consume results now accept any context.** `passthroughFailedTransactionPlanExecution`, `createFailedToSendTransactionError`, `createFailedToSendTransactionsError` and `createFailedToExecuteTransactionPlanError` were non-generic, so they implicitly demanded the default signature-guaranteeing context and rejected results parameterised with anything else. They are now generic over `TContext` and preserve it. Where they read a signature to build an error message they narrow it at runtime, so a result without one simply omits it from the message.

**Execution behaviour is unchanged.** The executor still populates `context.signature` from the signature or transaction your callback returns, and still recovers one for failed results from a `transaction` left on the context. Those writes just no longer show up in the result type unless your `TContext` asked for them. The behavioural changes are the two described above: an error message built from a context whose `signature` is absent, or is not a string, now omits it rather than interpolating whatever was there, and a returned context is recognised by the absence of a `signatures` map rather than the presence of a `signature`.
