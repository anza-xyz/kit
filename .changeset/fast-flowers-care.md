---
'@solana/keys': minor
'@solana/signers': minor
---

Add `writeKeyPair` and `writeKeyPairSigner` helpers for persisting an extractable key pair to disk as a JSON byte array, matching the format produced by `solana-keygen`. Missing parent directories are created automatically, and written files use mode `0600`. These helpers are Node-only and refuse to overwrite an existing file unless the caller sets `unsafelyOverwriteExistingKeyPair: true`.
