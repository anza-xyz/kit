---
'@solana/errors': minor
'@solana/react': patch
---

Add the `SOLANA_ERROR__REACT__SUBSCRIPTION_CLOSED_WITHOUT_ERROR` error code. `useSubscriptionSWR` now surfaces this `SolanaError` when the underlying store reaches an error state without an error value (e.g. a `DataPublisher` emitting `undefined` on its error channel, or `controller.abort(null)`), instead of passing the nullish value to SWR's `next` — which would be treated as a success and silently wipe the cached data.
