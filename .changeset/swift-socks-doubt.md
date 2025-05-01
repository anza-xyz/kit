---
'@solana/transaction-messages': minor
'@solana/transactions': minor
'@solana/signers': minor
'@solana/errors': minor
'@solana/kit': minor
---

Deprecate the `I` prefix of four transaction message types to stay consistent with the rest of them. Namely, the following types are renamed and their old names are marked as deprecated:
- `ITransactionMessageWithFeePayer` -> `TransactionMessageWithFeePayer`
- `ITransactionMessageWithFeePayerSigner` -> `TransactionMessageWithFeePayerSigner`
- `ITransactionMessageWithSigners` -> `TransactionMessageWithSigners`
- `ITransactionMessageWithSingleSendingSigner` -> `TransactionMessageWithSingleSendingSigner`
