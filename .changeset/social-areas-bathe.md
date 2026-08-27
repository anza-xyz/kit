---
'@solana/transaction-messages': minor
'@solana/errors': minor
---

Validate compute unit limit and heap size when they are set on a transaction message

`setTransactionMessageComputeUnitLimit`, `setTransactionMessageHeapSize` and `setTransactionMessageConfig` now reject values the runtime will not honor as written, throwing `SOLANA_ERROR__TRANSACTION__COMPUTE_UNIT_LIMIT_OUT_OF_RANGE` or `SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE` at the point the value is set. An invalid heap size fails the transaction on-chain; a compute unit limit above the maximum is instead clamped down by the runtime, so the transaction quietly runs with a budget other than the one requested. A compute unit limit must be an integer in the range [0, 1,400,000]; a heap size must be an integer multiple of 1 KiB between 32 KiB and 256 KiB inclusive.

Decoding is unaffected: `decompileTransactionMessage` still returns messages carrying out-of-range values so that callers can inspect any transaction that reaches them.
