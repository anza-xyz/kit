---
'@solana/transaction-confirmation': patch
---

Fix an abort listener leak in `getTimeoutPromise`. The listener registered on the caller's `AbortSignal` was never removed after the promise settled, which caused listeners to accumulate when the same signal was reused across multiple calls. `getTimeoutPromise` now registers the listener with the auto-cleanup `signal` option already used by the other strategies in this package and releases it in a `finally` block.
