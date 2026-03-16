---
'@solana/kit': minor
---

Add compute unit limit estimation utilities: `estimateComputeUnitLimitFactory`, `estimateAndSetComputeUnitLimitFactory`, and `fillTransactionMessageProvisoryComputeUnitLimit`. These replace the external `@solana-program/compute-budget` estimation functions with Kit-native equivalents that work across all transaction versions.
