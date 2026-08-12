---
'@solana/plugin-interfaces': minor
'@solana/errors': minor
---

Add runtime type guards and assertion helpers for every `ClientWithX` interface. Multi-method capabilities are checked together, and failed assertions throw the new `SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES` error with the missing capability names in its context.
