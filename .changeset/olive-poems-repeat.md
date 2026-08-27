---
'@solana/transaction-messages': minor
'@solana/errors': minor
'@solana/kit': minor
---

Validate the loaded accounts data size limit when it is set on a transaction message

`setTransactionMessageLoadedAccountsDataSizeLimit` and `setTransactionMessageConfig` now reject limits the runtime will not honor as written, throwing `SOLANA_ERROR__TRANSACTION__LOADED_ACCOUNTS_DATA_SIZE_LIMIT_OUT_OF_RANGE` at the point the value is set. The limit must be an integer in the range [1, 67,108,864] (64 MiB). The two ends of that range fail differently: a limit of zero is rejected outright by the runtime, whereas a limit above the maximum is silently clamped down, so the transaction runs against a budget other than the one requested.

Because zero is no longer a legal limit, `fillTransactionMessageProvisoryResourceLimits` now fills the loaded accounts data size limit of a version 1 message with 1 rather than 0, and `estimateAndSetResourceLimitsFactory` treats 1 as the provisory value it will replace with an estimate. The compute unit limit still uses 0. The placeholder occupies a fixed-width `u32` on the wire either way, so the space reserved for the eventual estimate is unchanged.

Decoding is unaffected: `decompileTransactionMessage` still returns messages carrying out-of-range values so that callers can inspect any transaction that reaches them.
