---
'@solana/errors': minor
---

Add the `SOLANA_ERROR__WALLET__INVALID_MESSAGE_SIGNATURE` and `SOLANA_ERROR__WALLET__INVALID_SIGN_IN_OUTPUT` error codes, thrown when a wallet returns a message signature or a sign-in output that fails verification. Their context carries the signing account's `address` and the `walletName`.

Also add the `SOLANA_ERROR__WALLET__INVALID_NUMBER_OF_OUTPUTS` error code, thrown when a wallet feature returns a different number of outputs than the number of inputs it was given. Its context carries the `expected` and `actual` number of outputs, the `featureName` and the `walletName`.
