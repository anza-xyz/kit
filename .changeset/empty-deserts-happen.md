---
'@solana/kit': major
---

`createReactiveStoreWithInitialValueAndSlotTracking` now consumes its two inputs as reactive sources rather than as request objects it calls `send()` / `subscribe()` on directly. The `rpcRequest` / `rpcSubscriptionRequest` config fields (and their `rpcValueMapper` / `rpcSubscriptionValueMapper`) are replaced by `initialValueSource: ReactiveActionSource<...>` / `streamSource: ReactiveStreamSource<...>` (with `initialValueMapper` / `streamValueMapper`).

Each source is consumed via its `reactiveStore()` method, so the helper reuses `ReactiveActionStore` / `ReactiveStreamStore` primitives. `PendingRpcRequest` satisfies `ReactiveActionSource` and `PendingRpcSubscriptionsRequest` satisfies `ReactiveStreamSource`, so callers can still pass eg. `rpc.getBalance(addr)` / `rpcSubscriptions.accountNotifications(addr)` results directly.

```ts
const balanceStore = createReactiveStoreWithInitialValueAndSlotTracking({
    initialValueSource: rpc.getBalance(myAddress, { commitment: 'confirmed' }),
    initialValueMapper: lamports => lamports,
    streamSource: rpcSubscriptions.accountNotifications(myAddress),
    streamValueMapper: ({ lamports }) => lamports,
});
balanceStore.withSignal(AbortSignal.timeout(60_000)).connect();
```
