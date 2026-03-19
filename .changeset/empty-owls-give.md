---
'@solana/signers': minor
---

Add `partiallySignTransactionWithSigners`, `signTransactionWithSigners`, and `signAndSendTransactionWithSigners` functions that accept a set of signers and a compiled `Transaction` directly, without requiring signers to be embedded in a transaction message. Also add `assertContainsResolvableTransactionSendingSigner` to validate that a set of signers contains an unambiguously resolvable sending signer. The existing transaction message helpers now delegate to these new functions internally.
