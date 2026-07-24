---
'@solana/signers': patch
---

Fix `TransactionMessageWithSigners` so its signer type parameter rejects fee payer and instruction signers of other transaction signer kinds.
