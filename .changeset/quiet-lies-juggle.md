---
'@solana/errors': minor
'@solana/instruction-plans': minor
---

Add `SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTION` and `SOLANA_ERROR__FAILED_TO_SIGN_TRANSACTIONS` error codes, together with the `createFailedToSignTransactionError` and `createFailedToSignTransactionsError` factories that raise them. These are the signing counterparts to the existing failed-to-send codes and factories, intended for high-level wrappers that sign transactions without submitting them: such a wrapper can now translate the low-level `SOLANA_ERROR__INSTRUCTION_PLANS__FAILED_TO_EXECUTE_TRANSACTION_PLAN` thrown by an executor into a user-facing error, exactly as the sending wrappers already do.

The signing errors carry the same context as their sending counterparts, including the non-enumerable `transactionPlanResult` and the optional simulation `logs` and `preflightData`. Those simulation fields are populated for signing too, because executors typically estimate resource limits by simulating before they sign, so a failed estimation reaches the error the same way it does when sending.

They differ from the sending errors in one respect: the message carries no indicator of where the failure happened. That indicator exists to locate a failure relative to network submission — `(preflight)` before it, or the transaction signature after it — and signing never submits, so neither applies. A signature would be particularly misleading, since quoting one implies the transaction reached the network when it never did. The `logs` and `preflightData` context properties are still populated whenever a simulation was responsible, and those logs still appear in the message, so only the prefix is dropped.
