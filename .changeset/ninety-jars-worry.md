---
'@solana/rpc-api': minor
---

Export the `getTransactionsForAddress` filter, config and result types from `@solana/rpc-api`. Because the method has nine overloads, `Parameters<>` and `ReturnType<>` only resolve the last one, so consumers previously had to rebuild these shapes by hand. The full-result items are available as `GetTransactionsForAddressFullJsonParsed`, `GetTransactionsForAddressFullJson`, `GetTransactionsForAddressFullBase64` and `GetTransactionsForAddressFullBase58`, each generic over `TMaxSupportedTransactionVersion` and defaulting to the legacy shape, mirroring the `GetTransactionApiResponse*` types.
