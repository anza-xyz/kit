---
'@solana/subscribable': major
'@solana/rpc-subscriptions-spec': major
'@solana/kit': major
---

Add `withSignal()` to `ReactiveStreamStore` for per-connection cancellation, replacing the construction-time `abortSignal` option. Mirrors the action store's per-dispatch `withSignal()` pattern — callers attach a per-connection signal at the call site instead of baking one into the store.

```ts
const store = createReactiveStoreFromDataPublisherFactory({
    createDataPublisher: signal => transport({ signal, ...plan }),
    dataChannelName: 'notification',
    errorChannelName: 'error',
});
// Per-connection timeout — fresh clock per attempt:
store.withSignal(AbortSignal.timeout(30_000)).connect();
```

`store.withSignal(signal)` returns a thin wrapper exposing `connect()` that composes the caller-provided signal with the per-connection inner controller via `AbortSignal.any`. Aborting the caller's signal surfaces the abort reason on state as `{ status: 'error' }`; supersession via the internal controller (a newer `connect()` or `reset()`) stays silent so the newer call owns state. The "permanent kill switch" pattern is expressible by binding once: `const killable = store.withSignal(killCtrl.signal); killable.connect();`. After `killCtrl.abort()`, every `killable.connect()` short-circuits to error.

`createDataPublisher` is widened from `() => Promise<DataPublisher>` to `(signal: AbortSignal) => Promise<DataPublisher>`. The store passes the composed per-connection signal to the factory so the underlying transport can stop on per-connection abort, not just the stream-store's listeners. Existing no-arg factories still satisfy the new shape — TypeScript allows fewer parameters than the declared type.

The construction-time `abortSignal` option on `createReactiveStoreFromDataPublisherFactory`, `createReactiveStoreWithInitialValueAndSlotTracking`, and `PendingRpcSubscriptionsRequest.reactiveStore()` is removed. Callers wanting a long-lived kill switch use the bind-once `withSignal` pattern. `ReactiveStreamSource<T>.reactiveStore()` is now parameter-less (mirrors `ReactiveActionSource<T>.reactiveStore()`).
