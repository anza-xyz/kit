---
'@solana/signers': minor
---

Allow transaction messages with no lifetime constraints to be signed using the Signer API helpers such as `signTransactionMessageWithSigners` and `partiallySignTransactionMessageWithSigners`. This is because some `TransactionSigners` such as `TransactionModifyingSigners` have the ability to update the transaction before signing it, meaning that the lifetime constraint may not be known until the transaction is signed.
