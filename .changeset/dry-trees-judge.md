---
'@solana/instruction-plans': major
---

The `executeTransactionMessage` callback in `createTransactionPlanExecutor` now receives a mutable context object as its first argument. This context can be incrementally populated during execution (e.g. with the latest transaction message, the compiled transaction, or custom properties) and is preserved in the resulting `SingleTransactionPlanResult` regardless of the outcome. If an error is thrown at any point in the callback, any attributes already saved to the context will still be available in the `FailedSingleTransactionPlanResult`, which is useful for debugging failures or building recovery plans.

The callback must now return either a `Signature` or a full `Transaction` object directly, instead of wrapping the result in an object.

**BREAKING CHANGES**

**`executeTransactionMessage` callback signature changed.** The callback now receives `(context, message, config)` instead of `(message, config)` and returns `Signature | Transaction` instead of `{ transaction: Transaction } | { signature: Signature }`.

```diff
  const executor = createTransactionPlanExecutor({
-   executeTransactionMessage: async (message, { abortSignal }) => {
+   executeTransactionMessage: async (context, message, { abortSignal }) => {
      const transaction = await signTransactionMessageWithSigners(message);
+     context.transaction = transaction;
      await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
-     return { transaction };
+     return transaction;
    }
  });
```

**Custom context is now set via mutation instead of being returned.** Previously, custom context was returned as part of the result object. Now, it must be set directly on the mutable context argument.

```diff
  const executor = createTransactionPlanExecutor({
-   executeTransactionMessage: async (message) => {
-     const transaction = await signAndSend(message);
-     return { transaction, context: { custom: 'value' } };
+   executeTransactionMessage: async (context, message) => {
+     context.custom = 'value';
+     const transaction = await signAndSend(message);
+     return transaction;
    }
  });
```
