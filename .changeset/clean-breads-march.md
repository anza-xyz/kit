---
'@solana/signers': minor
'@solana/keys': minor
---

Add an optional `extractable` argument to `generateKeyPair` and `generateKeyPairSigner`. It defaults to `false`, preserving the existing secure-by-default behavior, but can be set to `true` when you need to export the generated private key bytes via `crypto.subtle.exportKey()`.
