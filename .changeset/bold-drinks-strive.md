---
'@solana/rpc-spec': minor
'@solana/kit': minor
---

Add a `reactiveStore()` method to `PendingRpcRequest`. It fires the request on construction and synchronously returns a `ReactiveActionStore` that holds the request's `idle`/`running`/`success`/`error` lifecycle state. Compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives. Call `dispatch()` to re-fire the request (e.g. after an error), or `reset()` to abort the in-flight call and return to idle.

```ts
const store = rpc.getAccountInfo(address).reactiveStore();
const state = useSyncExternalStore(store.subscribe, store.getState);
if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.dispatch} />;
if (state.status === 'running' && !state.data) return <Spinner />;
return <View data={state.data!} />;
```
