---
'@solana/instruction-plans': major
---

Stop writing to the execution context in `createTransactionPlanExecutor`

The `executeTransactionMessage` callback can no longer return a `Signature` or a `Transaction`. Those return values were deprecated when the callback gained the ability to return the context that a successful result should carry, and they are now gone: that context, a complete `TContext`, is the only thing the callback returns. Nothing is written to it on your behalf.

```diff
const transactionPlanExecutor = createTransactionPlanExecutor({
  executeTransactionMessage: async (context, message) => {
    const transaction = await signTransactionMessageWithSigners(message);
    context.transaction = transaction;
+   const signature = getSignatureFromTransaction(transaction);
    await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
-   return transaction;
+   return { signature, transaction };
  },
});
```

The mutable `context` argument is still there, and still serves the failure path: whatever the callback stores on it before it throws is preserved in the resulting `FailedSingleTransactionPlanResult`. The two channels differ only in which outcome they feed. Mutating the context makes a value available to a failed result; returning it makes a value available to a successful one. On success the two are merged, with the returned value taking precedence, so a property stored but not returned is still reported.

Note that the callback cannot simply return the context it was given — every property on it is optional, so it does not satisfy `TContext`. Build the return value from the values you have instead. This is the point of the return type: a callback that declares a context with a required `signature` and never produces one now fails to compile, rather than yielding a successful result whose `context.signature` is typed but `undefined` at runtime.

**This unblocks executors that never obtain a fee payer signature.** Previously the executor derived `context.signature` by calling `getSignatureFromTransaction` on a returned transaction, and on any transaction found on the context while handling a failure. That call throws `SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING` when the fee payer slot is empty, so an executor that deliberately produces partially signed transactions — signed by an authority, to be paid for and submitted by a relayer later — could not succeed, and one that stored such a transaction before failing had its original error replaced by that one. Neither derivation exists any more, so both cases now work. Declare a context type that does not require a signature and store just the transaction:

```ts
const transactionPlanExecutor = createTransactionPlanExecutor<{ transaction: Transaction }>({
  executeTransactionMessage: async (_context, message) => {
    return { transaction: await signTransactionMessageWithSigners(message) };
  },
});
```

**Signatures are no longer added behind your back.** An executor whose `TContext` requires a `signature` — including the default `TransactionPlanResultContextWithSignature` — must now produce one itself, and the compiler holds it to that. Failed results carry only what the callback stored on the context before it threw; a `signature` is no longer recovered from a stored transaction.

**`BaseTransactionPlanResultContext` is removed.** It described the fields the executor used to write on your behalf, and nothing writes them any more — what a context holds is entirely `TContext`'s business. Use `TransactionPlanResultContextWithSignature` where you want the signature guarantee, or declare the optional `message` / `signature` / `transaction` fields your own context actually needs.

**`successfulSingleTransactionPlanResultFromTransaction` is removed.** It was the last place that derived a `signature` on your behalf — by calling `getSignatureFromTransaction`, with the same fee-payer-signature requirement described above — and the executor no longer uses it. Construct results with `successfulSingleTransactionPlanResult` instead, passing the context explicitly:

```diff
- successfulSingleTransactionPlanResultFromTransaction(message, transaction);
+ successfulSingleTransactionPlanResult(message, {
+   signature: getSignatureFromTransaction(transaction),
+   transaction,
+ });
```
