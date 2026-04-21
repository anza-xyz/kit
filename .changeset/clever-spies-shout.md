---
'@solana/subscribable': minor
'@solana/errors': minor
'@solana/kit': minor
---

Add `retry()` and `getUnifiedState()` to `ReactiveStore`. The new `getUnifiedState()` returns a discriminated `{ data, error, status }` snapshot with stable identity, so stores can be passed directly to `useSyncExternalStore` without an intermediate wrapper. `getState()` and `getError()` remain on the type but are now `@deprecated` in favour of the unified snapshot.

A new `createReactiveStoreFromDataPublisherFactory` function is also introduced. It accepts a `createDataPublisher: () => Promise<DataPublisher>` factory rather than a ready-made publisher, which lets the store reconnect via `retry()` after an error. The existing `createReactiveStoreFromDataPublisher` is now `@deprecated`; calling `retry()` on a store it produced throws a new `SolanaError` with code `SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED`.

`createReactiveStoreWithInitialValueAndSlotTracking` (from `@solana/kit`) now supports `retry()`, which re-sends the RPC request and re-subscribes to the subscription with a fresh abort signal while preserving the last known slot and value.
