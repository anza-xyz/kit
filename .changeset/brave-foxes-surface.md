---
'@solana/instruction-plans': patch
---

Unwrap `SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS` errors in `createFailedToSendTransactionError` and `createFailedToSendTransactionsError`. Previously, failures surfaced by the resource limits estimator hid the underlying transaction error behind the simulation wrapper and omitted the `(preflight)` indicator and simulation logs from the error message.
