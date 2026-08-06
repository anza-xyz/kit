---
'@solana/transactions': minor
---

Added `getSignatureFromTransactionIfPresent`, which returns the `Signature` that uniquely identifies a transaction, or `undefined` when its fee payer has not signed it yet. Use it in preference to `getSignatureFromTransaction` when a transaction is legitimately allowed to be unsigned by its fee payer — for instance one that has been partially signed by an authority and is destined for a relayer that will pay for it. `getSignatureFromTransaction` is now implemented in terms of it and continues to throw `SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING` in that case.
