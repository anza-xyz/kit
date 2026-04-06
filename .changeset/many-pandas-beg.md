---
'@solana/subscribable': minor
'@solana/rpc-subscriptions-spec': minor
---

Add `ReactiveStore` type and `createReactiveStoreFromDataPublisher()` to `@solana/subscribable`, and a `reactive()` method to pending subscriptions in `@solana/rpc-subscriptions-spec` that returns a reactive store compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives.
