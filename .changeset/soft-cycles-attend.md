---
'@solana/transaction-confirmation': minor
---

Add a new public `waitForSignatureConfirmationWithTimeout` waiter for confirming a transaction by its signature using a time-based lifetime. The previously deprecated `waitForRecentTransactionConfirmationUntilTimeout` now delegates to it.
