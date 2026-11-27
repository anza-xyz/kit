---
'@solana/plugin-interfaces': minor
'@solana/errors': minor
'@solana/kit': minor
---

Add `isClientWithX` and `assertIsClientWithX` helpers for every `ClientWithX` interface in `@solana/plugin-interfaces`, so plugins can check at runtime that a client provides the capabilities they need and narrow its type accordingly. Interfaces that group several functions, such as `ClientWithTransactionPlanning`, are checked as a whole, and capabilities are detected without reading them so reactive getters are never invoked. Failed assertions throw the new `SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES` error, whose context lists the required capabilities. `@solana/kit` now re-exports these helpers alongside the interfaces.
