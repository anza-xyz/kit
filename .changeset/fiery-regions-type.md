---
'@solana/rpc-spec': major
---

`PendingRpcRequest.reactiveStore()` no longer auto-fires the request on creation. It now returns a `ReactiveActionStore` in the `idle` state; the caller is responsible for the initial `dispatch()`.

This brings `reactiveStore()` in line with `createReactiveActionStore(fn)` (which also does not auto-fire) and removes the special-case at the start of the store's lifecycle. The previous auto-fire created an asymmetry around per-attempt cancellation: the initial request had no caller-visible dispatch site, so attaching an `AbortSignal` to that one specific attempt required a separate option distinct from the mechanism for all later attempts. Without auto-fire, every dispatch is the caller's, and signal attachment is uniform.

Migration:

```ts
// Before:
const store = rpc.getAccountInfo(address).reactiveStore();
// request was already in flight

// After:
const store = rpc.getAccountInfo(address).reactiveStore();
store.dispatch();
// request is now in flight
```
