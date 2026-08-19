---
'@solana/instruction-plans': major
'@solana/rpc-transformers': major
'@solana/transactions': major
'@solana/kit': major
---

Remove APIs that were deprecated in previous versions: the compute-unit-limit estimation helpers in `@solana/kit`, the `getBigIntDowncastRequestTransformer` in `@solana/rpc-transformers`, the fixed transaction size constants in `@solana/transactions`, and the `SuccessfulBaseTransactionPlanResultContext` type in `@solana/instruction-plans`.

**BREAKING CHANGES**

**`estimateComputeUnitLimitFactory` removed from `@solana/kit`.** Use `estimateResourceLimitsFactory` instead. The resource-limits estimator returns both the compute unit limit and (for version 1 transactions) the loaded accounts data size limit from a single simulation call.

```diff
- const estimateComputeUnitLimit = estimateComputeUnitLimitFactory({ rpc });
- const computeUnitLimit = await estimateComputeUnitLimit(transactionMessage);
+ const estimateResourceLimits = estimateResourceLimitsFactory({ rpc });
+ const { computeUnitLimit } = await estimateResourceLimits(transactionMessage);
```

**`estimateAndSetComputeUnitLimitFactory` removed from `@solana/kit`.** Use `estimateAndSetResourceLimitsFactory` instead, which additionally sets the loaded accounts data size limit for version 1 transactions.

```diff
- const estimateAndSet = estimateAndSetComputeUnitLimitFactory(estimateComputeUnitLimitFactory({ rpc }));
+ const estimateAndSet = estimateAndSetResourceLimitsFactory(estimateResourceLimitsFactory({ rpc }));
  const updatedMessage = await estimateAndSet(transactionMessage);
```

**`fillTransactionMessageProvisoryComputeUnitLimit` removed from `@solana/kit`.** Use `fillTransactionMessageProvisoryResourceLimits` instead, which additionally reserves space for the loaded accounts data size limit on version 1 transactions.

```diff
- const filledMessage = fillTransactionMessageProvisoryComputeUnitLimit(transactionMessage);
+ const filledMessage = fillTransactionMessageProvisoryResourceLimits(transactionMessage);
```

**`getBigIntDowncastRequestTransformer` removed from `@solana/rpc-transformers`.** This transformer was no longer used by the default Solana RPC request transformer. The Solana RPC transport serializes `bigint` values losslessly as large integer literals, and Agave parses JSON integers across the full `u64` range without precision loss, so downcasting `bigint`s to (potentially lossy) `number`s is unnecessary. If you still need this behavior, recreate it with `getTreeWalkerRequestTransformer`.

**`TRANSACTION_PACKET_SIZE`, `TRANSACTION_PACKET_HEADER`, and `TRANSACTION_SIZE_LIMIT` removed from `@solana/transactions`.** Transaction size is no longer constant, as version 1 transactions have a larger size limit. Use `getTransactionSizeLimit` to get the size limit for a specific transaction based on its version, or the `LEGACY_TRANSACTION_SIZE_LIMIT` and `V1_TRANSACTION_SIZE_LIMIT` constants for a specific version.

```diff
- const numFreeBytes = TRANSACTION_SIZE_LIMIT - getTransactionSize(transaction);
+ const numFreeBytes = getTransactionSizeLimit(transaction) - getTransactionSize(transaction);
```

**`SuccessfulBaseTransactionPlanResultContext` removed from `@solana/instruction-plans`.** Use `TransactionPlanResultContextWithSignature` instead as the context type argument.

```diff
- function processResult(result: SuccessfulSingleTransactionPlanResult<SuccessfulBaseTransactionPlanResultContext>) {
+ function processResult(result: SuccessfulSingleTransactionPlanResult<TransactionPlanResultContextWithSignature>) {
```
