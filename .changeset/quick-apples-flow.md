---
'@solana/transaction-messages': minor
---

Add legacy and v0 transaction support to compute budget setters and getters. Priority fees are now handled by version-gated helpers: `(get|set)TransactionMessagePriorityFeeLamports` for v1 (total lamports) and `(get|set)TransactionMessageComputeUnitPrice` for legacy/v0 (micro-lamports per compute unit).
