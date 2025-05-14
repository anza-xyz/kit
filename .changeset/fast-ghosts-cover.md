---
'@solana/transaction-messages': minor
---

Rename `isDurableNonceTransaction` to `isTransactionMessageWithDurableNonceLifetime` and `assertIsDurableNonceTransactionMessage` to `assertIsTransactionMessageWithDurableNonceLifetime` for consistency with the blockhash lifetime. The old names are kept as aliases but marked as deprecated.
