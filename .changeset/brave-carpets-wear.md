---
'@solana/promises': minor
---

Added `isAbortError(err)` — returns `true` if `err` is an `Error` whose `name` is `'AbortError'`. Use it to distinguish abort rejections from other failures without having to `instanceof`-check every platform-specific error class.
