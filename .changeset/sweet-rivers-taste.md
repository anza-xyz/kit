---
'@solana/plugin-core': patch
'@solana/kit': patch
---

Fix `withCleanup` throwing `DisposableStack is not defined` on Safari

`withCleanup` constructed a `DisposableStack` unconditionally, but Safari has not shipped explicit resource management — as of Safari 27 it provides neither `DisposableStack` nor `Symbol.dispose` — so any plugin that registers a cleanup function threw `ReferenceError: Can't find variable: DisposableStack` while the client was being built.

The runtime's own `DisposableStack` is still used whenever it exists. Only where it is missing does `withCleanup` fall back to an internal stack that reproduces the behaviour it depends on. The `withCleanup` test suite now runs twice, once against each stack, so the two cannot drift apart.

Note that this fixes disposal on Safari but not `using` declarations in your own code, which additionally need a `Symbol.dispose` polyfill; disposing a client explicitly works either way.
