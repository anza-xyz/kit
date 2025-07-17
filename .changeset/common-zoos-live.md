---
'@solana/errors': patch
---

Allow `SolanaError` context objects to use non-enumerable properties. This is useful when it's appropriate for an object to appear in the error context at runtime, but when that object can't be serialized for use by the production mode error decoder. Prior to this, non-enumerable properties would be deleted from context objects when creating new `SolanaErrors`.
