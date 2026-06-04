---
'@solana/offchain-messages': minor
'@solana/errors': minor
---

Add a `verifyOffchainMessage` helper that verifies a signed version 1 offchain message returned by an untrusted signer (eg. a wallet) in a single call. From the `message` and `requiredSigners` you requested, it reconstructs the version 1 message you expected the signer to sign, asserts that it matches the bytes the signer reports having signed, and then asserts that the signature is a valid Ed25519 signature of those bytes by the signer. This closes the gap where verifying the signature alone would let a compromised signer return a valid signature over data unrelated to what was requested. It supports version 1 messages, matching the `solana:signOffchainMessage` wallet feature. For the common case of a connected wallet signing a message only it needs to sign, `requiredSigners` is optional and defaults to `[signer]`. A new `SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED` error code is thrown when the signed bytes do not match the expected message.
