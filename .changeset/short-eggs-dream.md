---
'@solana/errors': patch
'@solana/transactions': patch
---

Throw when a v1 transaction message is decoded from a signatures-first envelope instead of misreading it with the legacy/v0 layout and keying the signature to the wrong address.
