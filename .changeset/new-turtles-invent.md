---
'@solana/react': minor
---

Add `useTrackedDataQuery` to the `@solana/react/query` subpath. This is the TanStack Query-backed counterpart to `useTrackedData`: it pairs a one-shot RPC fetch with an ongoing subscription (slot-deduped) and routes the unified stream through TanStack Query's cache via `experimental_streamedQuery`, surfacing the `SolanaRpcResponse<TItem>` envelope as `data`. Slot dedupe spans the cache, so a `refetch()`'s fresh store cannot regress the cached envelope to an older slot from a lagging RPC node.
