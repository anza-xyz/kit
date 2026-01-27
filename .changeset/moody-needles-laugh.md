---
'@solana/instruction-plans': patch
---

Fix a bug where a message packer that requires multiple iterations is not correctly added when forced to fit in a single transaction, even if it can fit
