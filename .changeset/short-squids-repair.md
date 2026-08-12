---
'@solana/instruction-plans': minor
---

Let the `createTransactionPlanExecutor` callback return the context of a successful result

The `executeTransactionMessage` callback may now return the context that a successful result should carry, instead of a `Signature` or a `Transaction`. When it does, that context is used as-is: nothing is derived from it, and in particular `getSignatureFromTransaction` is never called on your behalf.

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

Since a successful result always carries a signature, a returned context must include one — a callback that declares a custom context and forgets a property of it now fails to compile, rather than producing a result whose context is typed but `undefined` at runtime. That signature is also how the executor tells a returned context apart from a returned `Transaction`, which keeps its signatures in a `signatures` map and therefore never has one.

The mutable `context` argument is unchanged and still serves the failure path: whatever the callback stores on it before it throws is preserved in the resulting `FailedSingleTransactionPlanResult`. On success the two are merged, with the returned context taking precedence, so a property stored but not returned is still reported.

**Returning a `Signature` or a `Transaction` is deprecated.** Both still behave exactly as before — a returned signature is stored as `context.signature`, and a returned transaction is stored as `context.transaction` with its signature derived from it — and IDEs now flag those call sites, because `createTransactionPlanExecutor` gained a deprecated overload that only matches callbacks returning those types. Note that a config declared as `TransactionPlanExecutorConfig` up front is not flagged, since that type permits either return style.

Prefer returning a context, since deriving a signature from a transaction throws `SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING` when the fee payer slot is empty. An executor that deliberately produces partially signed transactions — signed by an authority, to be paid for and submitted by a relayer later — can now succeed by returning its own signature alongside the transaction. Dropping the signature from a successful result's context altogether remains impossible, since `SuccessfulSingleTransactionPlanResult` guarantees one.

Failure handling is unchanged, including the signature still derived from a `transaction` left on the context when the callback throws. Since the callback never returned anything in that case, there is nothing to bypass that derivation, so a callback working with fee-payer-unsigned transactions should avoid storing them on the context — otherwise deriving a signature from one replaces the error it meant to report.
