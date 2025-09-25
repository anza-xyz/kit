---
"@solana/compat": patch
---

Fixed a bug where calling `fromVersionedTransaction()` with a `VersionedTransaction` that uses address table lookups would result in a runtime fatal
