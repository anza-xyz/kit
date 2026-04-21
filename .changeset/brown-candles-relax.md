---
'@solana/rpc-subscriptions-spec': minor
'@solana/kit': minor
---

Add a `reactiveStore()` method to `PendingRpcSubscriptionsRequest`. Unlike `reactive()`, this variant returns a `ReactiveStore` synchronously and supports `retry()` to reconnect after an error. `reactive()` is now `@deprecated` in favour of `reactiveStore()`.

```ts
const store = rpc.accountNotifications(address).reactiveStore({ abortSignal });
const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.retry} />;
```
