---
'@solana/wallet-account-signer': minor
---

`createMessageSignerFromWalletAccount` now verifies each signature returned by the wallet against the account's address and the message the wallet signed, and `modifyAndSignMessages` rejects with `SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE` if any of them is invalid. It also rejects with `SOLANA_ERROR__WALLET__INVALID_NUMBER_OF_OUTPUTS` if the wallet returns a different number of signed messages than it was asked to sign. The returned message content and signatures are copies of the wallet's output, so the wallet cannot change them after they are verified. Verifying signatures requires Ed25519 support in the WebCrypto API; in environments without it, install `@solana/webcrypto-ed25519-polyfill`.
