---
'@solana/errors': patch
'@solana/instruction-plans': patch
---

Add `SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_SINGLE_TRANSACTION_PLAN` error code and a `createFailedToExecuteSingleTransactionPlanError` helper for use by `client.sendTransaction` (singular) to provide a more specific error with the underlying cause's message.
