---
'@solana/instruction-plans': major
---

Reshape the successful `SingleTransactionPlanResult` factory functions. The `successfulSingleTransactionPlanResult` helper now accepts a context object (which must include a `signature` property) instead of a separate `signature` argument. A new `successfulSingleTransactionPlanResultFromTransaction` helper is introduced for the common case of creating a successful result from a full `Transaction` object.

**BREAKING CHANGES**

**`successfulSingleTransactionPlanResult` renamed to `successfulSingleTransactionPlanResultFromTransaction`.** If you were creating a successful result from a `Transaction`, update the function name.

```diff
- successfulSingleTransactionPlanResult(message, transaction)
+ successfulSingleTransactionPlanResultFromTransaction(message, transaction)
```

**`successfulSingleTransactionPlanResultFromSignature` renamed to `successfulSingleTransactionPlanResult` with a new signature.** The `signature` is no longer a separate argument — it must be included in the `context` object.

```diff
- successfulSingleTransactionPlanResultFromSignature(message, signature)
+ successfulSingleTransactionPlanResult(message, { signature })
```

```diff
- successfulSingleTransactionPlanResultFromSignature(message, signature, context)
+ successfulSingleTransactionPlanResult(message, { ...context, signature })
```
