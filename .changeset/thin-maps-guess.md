---
'@solana/instruction-plans': major
---

Reshape `SingleTransactionPlanResult` from a single object type with a `status` discriminated union into three distinct types: `SuccessfulSingleTransactionPlanResult`, `FailedSingleTransactionPlanResult`, and `CanceledSingleTransactionPlanResult`. This flattens the result structure so that `status` is now a string literal (`'successful'`, `'failed'`, or `'canceled'`) and properties like `context`, `error`, and `signature` live at the top level of each variant.

Other changes include:

- Rename the `message` property to `plannedMessage` on all single transaction plan result types. This makes it clearer that this original planned message from the `TransactionPlan`, not the final message that was sent to the network.
- Move the `context` object from inside the `status` field to the top level of each result variant. All variants now carry a `context` — not just successful ones.
- Expand `TransactionPlanResultContext` to optionally include `message`, `signature`, and `transaction` properties.
- Remove the now-unused `TransactionPlanResultStatus` type.
- `failedSingleTransactionPlanResult` and `canceledSingleTransactionPlanResult` now accept an optional `context` parameter.

**BREAKING CHANGES**

**Accessing the status kind.** Replace `result.status.kind` with `result.status`.

```diff
- if (result.status.kind === 'successful') { /* ... */ }
+ if (result.status === 'successful') { /* ... */ }
```

**Accessing the signature.** The signature has moved from `result.status.signature` to `result.context.signature`.

```diff
- const sig = result.status.signature;
+ const sig = result.context.signature;
```

**Accessing the transaction.** The transaction has moved from `result.status.transaction` to `result.context.transaction`.

```diff
- const tx = result.status.transaction;
+ const tx = result.context.transaction;
```

**Accessing the error.** The error has moved from `result.status.error` to `result.error`.

```diff
- const err = result.status.error;
+ const err = result.error;
```

**Accessing the context.** The context has moved from `result.status.context` to `result.context`.

```diff
- const ctx = result.status.context;
+ const ctx = result.context;
```

**Accessing the message.** The `message` property has been renamed to `plannedMessage`.

```diff
- const msg = result.message;
+ const msg = result.plannedMessage;
```

**`TransactionPlanResultStatus` removed.** Code that references this type must be updated to use the individual result variant types (`SuccessfulSingleTransactionPlanResult`, `FailedSingleTransactionPlanResult`, `CanceledSingleTransactionPlanResult`) or the `SingleTransactionPlanResult` union directly.
