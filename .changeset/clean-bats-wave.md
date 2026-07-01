---
'@solana/subscribable': minor
'@solana/errors': minor
'@solana/kit': minor
'@solana/react': minor
---

Add `bridgeStoreToAsyncIterable` to `@solana/subscribable`

`bridgeStoreToAsyncIterable` adapts a `ReactiveStreamStore` into the pull-based `AsyncIterable` contract that consumers like TanStack Query's `experimental_streamedQuery` expect. It is now a public export of `@solana/subscribable` (and re-exported from `@solana/kit`). It was previously an internal helper of `@solana/react`, but it is not React- or TanStack-specific and is useful to any consumer that needs to drive a stream store by `for await`-ing it.

The bridge only observes the store — consistent with the rest of the ecosystem, the caller owns the store's lifecycle (`connect()` it yourself, bound to the same signal, and `reset()` it when done). The bridge subscribes, seeds from the store's current snapshot, yields values, and unsubscribes when iteration ends.

It throws the new `SOLANA_ERROR__SUBSCRIBABLE__STREAM_CLOSED_WITHOUT_ERROR` when a store closes in an error state with a nullish payload. This is the error `useSubscriptionQuery` and `useTrackedDataQuery` now surface in that case; the SWR bridge is unaffected.
