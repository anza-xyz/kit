---
'@solana/errors': minor
'@solana/kit': minor
---

Added `estimateResourceLimitsFactory`, `estimateAndSetResourceLimitsFactory`, and `fillTransactionMessageProvisoryResourceLimits` to `@solana/kit`. These mirror the existing compute-unit estimators but additionally estimate and set the loaded accounts data size limit, which is required for version 1 transactions. Both limits are derived from a single simulation call.

Two new error codes were added to `@solana/errors`: `SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_LOADED_ACCOUNTS_DATA_SIZE_LIMIT` (thrown when an RPC fails to return a `loadedAccountsDataSize` value while estimating a version 1 transaction) and `SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS` (the resource-limits counterpart of `SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT`).

## Migration

The compute-unit-only helpers are still exported but are now deprecated. The new helpers handle every transaction version: for legacy and version 0 messages they behave the same as the old ones (only the compute unit limit is set); for version 1 messages they additionally set the loaded accounts data size limit, which is required for v1.

### `estimateComputeUnitLimitFactory` → `estimateResourceLimitsFactory`

The new estimator returns an object instead of a `number`. Destructure `computeUnitLimit` from the result:

```ts
// Before
const estimateComputeUnitLimit = estimateComputeUnitLimitFactory({ rpc });
const units = await estimateComputeUnitLimit(transactionMessage);

// After
const estimateResourceLimits = estimateResourceLimitsFactory({ rpc });
const { computeUnitLimit } = await estimateResourceLimits(transactionMessage);
// If provided by the RPC, `loadedAccountsDataSizeLimit` is also returned
```

### `estimateAndSetComputeUnitLimitFactory` → `estimateAndSetResourceLimitsFactory`

The new helper accepts the multi-resource estimator and returns a function with the same shape as before — it takes a transaction message and returns the same message with resource limits set. No call-site change beyond the factory swap:

```ts
// Before
const estimator = estimateComputeUnitLimitFactory({ rpc });
const estimateAndSet = estimateAndSetComputeUnitLimitFactory(estimator);

// After
const estimator = estimateResourceLimitsFactory({ rpc });
const estimateAndSet = estimateAndSetResourceLimitsFactory(estimator);
```

Behavior note: the new helper re-estimates the compute unit limit when it is unset, set to the provisory value of `0`, or set to the runtime max of `1_400_000` (same as before). For the loaded accounts data size limit on v1 messages it only re-estimates when unset or set to the provisory `0`; an explicit value — including the runtime max of 64 MiB — is left untouched, since callers who set it explicitly are signaling a deliberate choice.

### `fillTransactionMessageProvisoryComputeUnitLimit` → `fillTransactionMessageProvisoryResourceLimits`

The signature is unchanged. For v1 messages, the new helper additionally reserves a provisory `0` for the loaded accounts data size limit when none is set. For legacy and v0 messages, the behavior is unchanged and the function only reserves space for the CU limit. 

```ts
// Before
const reserved = fillTransactionMessageProvisoryComputeUnitLimit(transactionMessage);

// After
const reserved = fillTransactionMessageProvisoryResourceLimits(transactionMessage);
```
