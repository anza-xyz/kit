---
'@solana/react': minor
---

Add `useTrackedDataSwr(key, spec, options?)` to the `@solana/react/swr` subpath — the SWR-backed counterpart to `useTrackedData`. Takes the same `TrackedDataSpec` and routes the unified, slot-deduped stream through SWR's `useSWRSubscription`.

```tsx
import { useTrackedDataSwr } from '@solana/react/swr';

const { data } = useTrackedDataSwr(['balance', address], spec);
// data is `SolanaRpcResponse<TItem> | undefined`
```

`data` is the `SolanaRpcResponse<TItem>` envelope emitted by the underlying kit primitive — the primitive's type guarantees the envelope shape, so callers read `data.value` (the unified item produced by the spec's mappers) and `data.context.slot` (the slot the store dedup'd on) directly. Mirrors core `useTrackedData`'s result so moving between the two is a pure swap. Pass `null` for either `key` or `spec` to disable. Options accept SWR's config plus `getAbortSignal` for per-attempt signals.
