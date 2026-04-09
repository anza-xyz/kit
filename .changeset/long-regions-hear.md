---
'@solana/kit': minor
---

Add `createAsyncGeneratorWithInitialValueAndSlotTracking`, an async generator alternative to `createReactiveStoreWithInitialValueAndSlotTracking` that yields values from both an RPC fetch and an ongoing subscription, silently dropping any value at a slot older than the last seen.
