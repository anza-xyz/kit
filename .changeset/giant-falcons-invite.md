---
'@solana/kit': minor
---

Add `createReactiveStoreFromRpcAndSubscription()`, a helper that combines an initial RPC fetch with an ongoing subscription into a single `ReactiveStore`. Uses slot-based comparison to ensure only the most recent value is kept, regardless of arrival order. Compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives.
