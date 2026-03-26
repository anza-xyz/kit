---
'@solana/plugin-core': minor
---

Add `withAsyncCleanup` function to `@solana/plugin-core`. Plugin authors can use it to register asynchronous teardown logic on a client, making it `AsyncDisposable`. If the client already implements `Symbol.asyncDispose`, it is awaited after the new cleanup; if only `Symbol.dispose` is present, it is called synchronously as a fallback.
