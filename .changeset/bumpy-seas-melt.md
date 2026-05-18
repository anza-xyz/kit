---
'@solana/subscribable': major
'@solana/rpc-subscriptions-spec': major
'@solana/kit': major
---

Drop auto-connect from `ReactiveStreamStore`; callers explicitly invoke `connect()` to open the underlying stream. Mirrors the action store's caller-driven `dispatch()` pattern — the store is a state machine that callers orchestrate, not a self-starting subscription.

The factory variant returned by `createReactiveStoreFromDataPublisherFactory` now starts in `status: 'idle'`. Call `store.connect()` to open the stream; from `idle`, the store transitions through `loading` → `loaded` (or `error`). A subsequent `connect()` from any non-idle status transitions through `retrying` while preserving the last known value. A new `reset()` method aborts the current connection and returns the store to `idle` without permanently killing it — natural for React effect cleanup.

```ts
const store = createReactiveStoreFromDataPublisherFactory({
    abortSignal,
    createDataPublisher,
    dataChannelName: 'notification',
    errorChannelName: 'error',
});
store.connect(); // opens the stream — previously this happened on construction
```

`retry()` is now deprecated; it remains as an error-only alias for `connect()`. Migrate to calling `connect()` directly. Code that previously relied on `retry()` being a no-op when the store was not in `error` state should add an explicit `if (status === 'error') store.connect();` guard at the call site.

`createReactiveStoreFromDataPublisher` (the deprecated non-factory variant accepting a ready-made `DataPublisher`) is removed. Its only documented use was as a backwards-compatibility alias behind `PendingRpcSubscriptionsRequest.reactive()`, which is also removed in this release. Migrate to the factory variant — wrap a ready-made publisher in `() => Promise.resolve(publisher)` if needed — and use `reactiveStore()` for RPC subscriptions.

`createReactiveStoreWithInitialValueAndSlotTracking` in `@solana/kit` no longer fires the RPC request on construction — call `store.connect()` to start it, or wrap in a `useEffect` that calls `connect()` on mount and `reset()` on cleanup. The store starts in `status: 'idle'` and follows the same lifecycle as the underlying stream store.
