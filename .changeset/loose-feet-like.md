---
'@solana/plugin-core': minor
---

Add `withCleanup` function to `@solana/plugin-core`. Plugin authors can use it to register teardown logic (e.g. closing connections or clearing timers) on a client, making it `Disposable`. If the client already implements `Symbol.dispose`, the new cleanup function is chained so both run on disposal.
