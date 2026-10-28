---
'@solana/errors': minor
---

Add the `SOLANA_ERROR__WALLET__FEATURE_VERSION_UNSUPPORTED` error code, thrown when an app requires a newer version of a wallet feature than the connected wallet supports (for example, a `solana:signIn` option that was introduced in v1.1.0 of the feature). Its context carries the `featureName`, the `requiredVersion`, the wallet's `actualVersion` and the `walletName`.
