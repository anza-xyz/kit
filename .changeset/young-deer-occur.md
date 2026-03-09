---
'@solana/errors': minor
'@solana/instruction-plans': minor
---

Enrich the `SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT` error context with the full simulation result (`Omit<RpcSimulateTransactionResult, 'err'>`) and add it to `SolanaErrorCodeWithCause`, aligning it with the `SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE` error.
