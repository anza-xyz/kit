---
'@solana/instruction-plans': patch
---

Fix `createTransactionPlanExecutor` throwing away the original error when a failed transaction was not signed by its fee payer

When the `executeTransactionMessage` callback stored a transaction on the context and then threw, the executor tried to recover that transaction's signature while handling the failure. If the fee payer had not signed it — as is the case for a transaction that is only partially signed at the point of failure — that recovery threw `SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING` from inside the error handler, destroying the original error and the partial `TransactionPlanResult` along with it.

The signature is now recovered on a best-effort basis. Whenever it cannot be determined — because the fee payer has not signed, or because the stored transaction is malformed in any other way — the `signature` property is simply left absent from the failed result's context, and the original error propagates as intended.
