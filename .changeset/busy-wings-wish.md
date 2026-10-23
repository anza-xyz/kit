---
'@solana/transaction-introspection': patch
'@solana/transaction-messages': minor
---

`decodeTransactionFromRpcResponse` now decodes the `transactionConfig` of a version 1 `json` RPC response into the compiled message's `configMask` and `configValues`, so it matches the `base64` and `base58` decodes. `getTransactionConfigMask` and `getTransactionConfigValues` are now exported from `@solana/transaction-messages`.
