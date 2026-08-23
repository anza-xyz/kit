---
'@solana/transaction-messages': minor
'@solana/errors': minor
---

Validate compute unit limit and heap size when they are set on a transaction message

`setTransactionMessageComputeUnitLimit`, `setTransactionMessageHeapSize` and `setTransactionMessageConfig` now reject values the runtime would refuse, throwing `SOLANA_ERROR__TRANSACTION__COMPUTE_UNIT_LIMIT_OUT_OF_RANGE` or `SOLANA_ERROR__TRANSACTION__INVALID_HEAP_SIZE` rather than letting the transaction fail at simulation or send time. A compute unit limit must be an integer in the range [0, 1,400,000]; a heap size must be an integer multiple of 1 KiB between 32 KiB and 256 KiB inclusive.

Decoding is unaffected: `decompileTransactionMessage` still returns messages carrying out-of-range values so that callers can inspect any transaction that reaches them.
