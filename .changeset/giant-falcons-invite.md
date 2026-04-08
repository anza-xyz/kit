---
'@solana/kit': minor
---

Add `createReactiveStoreWithInitialValueAndSlotTracking()`, a helper that combines an initial RPC fetch with an ongoing subscription into a single `ReactiveStore`. Uses slot-based comparison to ensure only the most recent value is kept, regardless of arrival order. The store state is a `SolanaRpcResponse<TItem>`. Compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives.
