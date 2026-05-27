---
'@solana/rpc-spec': minor
'@solana/rpc-subscriptions-spec': minor
'@solana/kit': minor
---

Add `RpcSendable<T>` and `RpcSubscribable<T>` structural duck-types alongside the concrete `PendingRpcRequest<T>` and `PendingRpcSubscriptionsRequest<T>`. Both new types are intentionally narrower — `RpcSendable<T>` covers just `send({ abortSignal })` and `RpcSubscribable<T>` covers just `subscribe({ abortSignal })` — so consumers (higher-level kit helpers, plugin-authored wrappers, test mocks) can accept request-like objects without taking on the full `{ reactiveStore, send }` / `{ reactiveStore, subscribe }` shape.

```ts
import type { RpcSendable, RpcSubscribable } from '@solana/kit';

type RpcSendable<TResponse> = {
    send(options?: RpcSendOptions): Promise<TResponse>;
};

type RpcSubscribable<TNotification> = {
    subscribe(options: RpcSubscribeOptions): Promise<AsyncIterable<TNotification>>;
};
```

`PendingRpcRequest<T>` still structurally satisfies `RpcSendable<T>`; `PendingRpcSubscriptionsRequest<T>` still satisfies `RpcSubscribable<T>`. No change at producer boundaries (`rpc.<method>(...)` / `rpcSubscriptions.<method>(...)` returns).

Loosens the `rpcRequest` / `rpcSubscriptionRequest` fields on `CreateReactiveStoreWithInitialValueAndSlotTrackingConfig` (exported) and the internal config for `createAsyncGeneratorWithInitialValueAndSlotTracking` from `PendingRpcRequest<...>` / `PendingRpcSubscriptionsRequest<...>` to `RpcSendable<...>` / `RpcSubscribable<...>` — both primitives only ever call `.send()` and `.subscribe()` on those inputs, so they now accept any compatible duck-type. Existing callers passing concrete `Pending*Request` objects continue to work.
