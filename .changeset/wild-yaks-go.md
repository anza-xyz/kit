---
'@solana/errors': patch
'@solana/instruction-plans': patch
---

Add `abortReason` to the `SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN` error context so consumers can access the abort reason when converting this error to higher-level error types.
