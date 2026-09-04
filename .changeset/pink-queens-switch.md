---
'@solana/signers': minor
---

Add `createLazyKeyPairSignerFromBytes`, a synchronous counterpart to `createKeyPairSignerFromBytes`. It derives the signer's address directly from the public key half of the 64-byte secret key and defers the asynchronous `CryptoKey` import until the first message or transaction is signed (memoising the result). This is useful when a signer must be created in a synchronous context whilst signing can remain asynchronous. Because the key import is deferred, the returned signer implements both `MessagePartialSigner` and `TransactionPartialSigner` but does not expose a `keyPair` property, and the cryptographic validation of the secret key happens on the first signing attempt rather than at creation time. The internal copy of the secret key is zeroed once the import succeeds, and a failed import is not cached so signing can be retried.
