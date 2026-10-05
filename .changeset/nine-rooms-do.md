---
'@solana/errors': minor
'@solana/keys': minor
'@solana/webcrypto-ed25519-polyfill': minor
---

`verifySignature()` now verifies strictly, regardless of whether the underlying WebCrypto implementation does so itself (Node.js, for instance, does not). It returns `false` when either the public key or the `R` component of the signature is a point of small order. Previously, trivially forged signatures could verify against small-order public keys such as `11111111111111111111111111111111`.

**BREAKING CHANGES**

**`verifySignature()` throws unless given an extractable public key.** Checking the public key requires reading its bytes, so a non-extractable public key now causes it to throw a `SolanaError` with code `SOLANA_ERROR__KEYS__VERIFICATION_REQUIRES_EXTRACTABLE_PUBLIC_KEY`. The same error is thrown for a key that is not a public key, which WebCrypto never accepted for verification anyway (it threw an `InvalidAccessError`). Every public key produced by Kit is extractable; if you import one yourself, set `extractable` to `true`.

```diff
- const publicKey = await crypto.subtle.importKey('raw', bytes, 'Ed25519', false, ['verify']);
+ const publicKey = await crypto.subtle.importKey('raw', bytes, 'Ed25519', true, ['verify']);
  await verifySignature(publicKey, signature, data);
```

**`getPublicKeyFromPrivateKey()` always returns an extractable public key.** Public keys are not secret, so this mirrors the behavior of `crypto.subtle.generateKey()`. The `extractable` argument is deprecated and ignored.

```diff
- const publicKey = await getPublicKeyFromPrivateKey(privateKey, true);
+ const publicKey = await getPublicKeyFromPrivateKey(privateKey);
```

The Ed25519 polyfill now also rejects public keys and signature `R` components of small order, and opts out of `@noble/ed25519`'s default ZIP-215 semantics.
