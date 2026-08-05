---
'@solana/offchain-messages': minor
'@solana/errors': minor
---

Add an `assertOffchainMessageV1Equal` helper that asserts that a version 1 offchain message you received from an untrusted signer (eg. a wallet) is the message you expected it to sign. Verifying a signature proves only that the signer produced it over the bytes it handed back, not that those bytes represent the message you asked for, so assert this before verifying signatures with `verifyOffchainMessageEnvelope`. The helper compares the content and the required signatories, and reports each kind of mismatch with its own error code: the new `SOLANA_ERROR__OFFCHAIN_MESSAGE__CONTENT_DOES_NOT_MATCH_EXPECTED` and `SOLANA_ERROR__OFFCHAIN_MESSAGE__REQUIRED_SIGNATORIES_DO_NOT_MATCH_EXPECTED`. Required signatories are compared without regard to order, since a decoded message lists them in the order the specification mandates while yours may be in any order. It accepts an `OffchainMessageV1` rather than the `OffchainMessage` union that decoding produces, so narrow the decoded message to a version 1 message before calling it.
