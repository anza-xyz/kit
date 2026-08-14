---
'@solana/instruction-plans': patch
---

Deprecate transaction plan result APIs being removed in v8

Both of the following are deprecated and will be removed in the next major version.

`successfulSingleTransactionPlanResultFromTransaction` derives the transaction `signature` on your behalf by calling `getSignatureFromTransaction`, which throws when the transaction's fee payer has not signed it. Construct results with `successfulSingleTransactionPlanResult` instead, passing the context explicitly:

```diff
- successfulSingleTransactionPlanResultFromTransaction(message, transaction, context);
+ successfulSingleTransactionPlanResult(message, {
+   ...context,
+   signature: getSignatureFromTransaction(transaction),
+   transaction,
+ });
```

`BaseTransactionPlanResultContext` goes away together with the intersections that graft it onto every `SingleTransactionPlanResult`. The context of a result is becoming entirely caller-defined — it will be exactly the `TContext` you supply — so there will be no separate base shape to merge in. If you refer to this type, declare whichever of its fields you need on your own context type instead:

```ts
type MyContext = {
    message?: TransactionMessage & TransactionMessageWithFeePayer;
    signature?: Signature;
    transaction?: Transaction;
};
```
