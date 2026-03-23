---
'@solana/signers': patch
---

Allow `deduplicateSigners` to handle structurally equivalent signers (e.g. two `createNoopSigner` calls with the same address) instead of throwing.
