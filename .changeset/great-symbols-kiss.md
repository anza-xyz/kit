---
'@solana/kit': patch
---

Fix `createReactiveStoreWithInitialValueAndSlotTracking` stranding the store in `loading` when a fresh `connect()` window is answered only by a stale-slot value

`lastUpdateSlot` persists across `connect()` windows so the surfaced value never regresses. Previously, a successful response at a slot older than the high-water mark was dropped entirely — including the status transition — so a reconnect (e.g. a `useTrackedData` `refresh()`) answered by a lagging RPC node while a quiet account's subscription emitted nothing would sit in `loading` forever. A stale-slot response now settles the store back to `loaded`, retaining the newer data it already holds rather than regressing to the older value.
