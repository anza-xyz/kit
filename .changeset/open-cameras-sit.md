---
'@solana/subscribable': minor
'@solana/kit': minor
---

Add framework-agnostic source duck-types for reactive bindings.

`@solana/subscribable` now exports two new types:

- `ReactiveStreamSource<T>` — anything with a `reactiveStore({ abortSignal })` method that returns a `ReactiveStreamStore<T>`. `PendingRpcSubscriptionsRequest<T>` satisfies this by design.
- `ReactiveActionSource<T>` — anything with a zero-argument `reactiveStore()` method that returns a `ReactiveActionStore<[], T>`. `PendingRpcRequest<T>` satisfies this by design.

These let reactive-framework bindings consume a single duck-type instead of naming concrete producer types — and let plugin authors expose their own pending-request objects to those bindings without modification.

Both source types live in `@solana/subscribable` and are not re-exported from `@solana/kit`, matching the existing convention for their parent `ReactiveStreamStore` / `ReactiveActionStore` types — anyone consuming a source duck-type is already in the reactive-primitives layer and will already be importing the related store types from the same package.

`@solana/kit` now publicly exports the previously-private `CreateReactiveStoreWithInitialValueAndSlotTrackingConfig` type so non-React consumers (e.g. plugins) can declare function return shapes based on it without taking a dependency on `@solana/react`.
