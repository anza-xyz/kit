---
'@solana/rpc-spec-types': patch
---

`stringifyJsonWithBigInts` now writes bigints as JSON numbers even when the application defines a `BigInt.prototype.toJSON` that returns a string.
