---
'@solana/instruction-plans': minor
'@solana/plugin-interfaces': minor
---

Added `ClientWithTransactionSigning` and `ClientWithSignedTransactionSending` client interfaces, so that plugins can offer transaction signing as a capability separate from sending. The signing methods accept the same input as their sending counterparts and return the new `SuccessfulSingleTransactionPlanResultWithTransaction` and `TransactionPlanResultWithTransactions` types, which guarantee that the transaction itself is present in the result context, and which `sendSignedTransaction` and `sendSignedTransactions` accept in turn. This makes it possible to sign now and broadcast later, or to sign in one place and broadcast in another.
