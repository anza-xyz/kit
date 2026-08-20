---
'@solana/transactions': patch
---

Fix `getTransactionSizeLimit` misclassifying single-signer legacy transactions as version 1. A legacy message has no version byte, so its first byte is the number of required signatures — `1` for every single-signer transaction — which was mistaken for a v1 version byte. As a result, `isTransactionWithinSizeLimit`, `assertIsTransactionWithinSizeLimit`, and `assertIsSendableTransaction` accepted legacy transactions of up to 4096 bytes that the network rejects at 1232 bytes. The version flag (high bit) of the first message byte is now required to be set before treating a transaction as version 1
