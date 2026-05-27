---
'@solana/react': minor
---

Add `useTrackedDataSWR(key, spec, options?)` to the `@solana/react/swr` subpath — the SWR-backed counterpart to `useTrackedData`. Takes the same `TrackedDataSpec` and routes the unified, slot-deduped stream through SWR's `useSWRSubscription`.

```tsx
import { useTrackedDataSWR } from '@solana/react/swr';

const { data } = useTrackedDataSWR(['balance', address], spec);
// data is `SolanaRpcResponse<TItem> | undefined`
```

`data` is shape `SolanaRpcResponse<TItem>`, because this hook requires the slot for de-duping. Mirrors core `useTrackedData`. Pass `null` for either `key` or `spec` to disable. Options accept SWR's config plus `getAbortSignal` for a custom abort signal.
