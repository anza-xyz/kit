---
'@solana/errors-core': minor
'@solana/errors': patch
---

Add `@solana/errors-core`, a new package containing the primitives — `createCodedErrorClass`, `formatMessageTemplate`, `encodeContextObject` / `decodeEncodedContext` — for building strongly-typed, numerically-coded JavaScript error classes. `@solana/errors` now consumes this package internally and re-exports `createCodedErrorClass` (and its associated types) so existing imports continue to work unchanged.

Downstream tooling (paymasters, wallets, codegen tools, etc.) that wants its own coded error system should depend on `@solana/errors-core` directly rather than pulling in the full Kit error catalog.
