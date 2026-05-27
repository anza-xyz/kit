---
'@solana/react': minor
---

Add `useTrackedDataSwr(key, spec, options?)` to the `@solana/react/swr` subpath — the SWR-backed counterpart to `useTrackedData`. Takes the same `TrackedDataSpec` and routes the unified, slot-deduped stream through SWR's `useSWRSubscription`.

```tsx
import { useTrackedDataSwr } from '@solana/react/swr';

const { data } = useTrackedDataSwr(['balance', address], spec);
// data is `{ slot: Slot | undefined; value: TItem } | undefined`
```

Returns the same `SlotTaggedValue<TItem>` shape as `useSubscriptionSwr` — `data.value` is the unified item produced by the spec's mappers, `data.slot` is the envelope's `context.slot`. Pass `null` for either `key` or `spec` to disable. Options accept SWR's config plus `getAbortSignal` for per-attempt signals.
