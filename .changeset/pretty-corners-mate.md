---
'@solana/signers': minor
'@solana/errors': minor
'@solana/keys': minor
---

Add `grindKeyPair`, `grindKeyPairs`, `grindKeyPairSigner`, and `grindKeyPairSigners` for mining vanity key pairs whose base58-encoded public key matches a `RegExp` or a custom predicate. Supports `amount` for mining multiple key pairs, `extractable` for forwarding to the underlying `generateKeyPair` call, `concurrency` (defaulting to `32`) for batched parallel key generation, and `abortSignal` for cancellation. Regex matchers are statically checked for base58-alphabet violations at runtime (after stripping escapes, character classes, quantifiers, and groups) to catch common typos like `/^sol0/`.
