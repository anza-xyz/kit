---
'@solana/errors': patch
---

Allow `SolanaError` context objects to use non-enumerable properties. Prior to this, non-enumerable properties would be deleted from context objectswhen creating new `SolanaErrors`.
