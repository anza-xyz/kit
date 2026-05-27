---
'@solana/react': minor
---

Add `@solana/react/swr` subpath with `useRequestSwr(key, source, options?)` — the SWR-backed counterpart to `useRequest`. Same source shape (`ReactiveActionSource<T>` or `(signal) => Promise<T>`); returns SWR's native `SWRResponse<T>`. Pass `null` for either `key` or `source` to disable. Requires `swr@^2` as an optional peer dependency.

```tsx
import { useRequestSwr } from '@solana/react/swr';

const { data } = useRequestSwr(['epochInfo'], client.rpc.getEpochInfo());
```

Options accept any `SWRConfiguration` field plus the Kit-only `getAbortSignal: () => AbortSignal` (same option as `useRequest`), which threads a per-attempt signal into the source — typically a timeout via `AbortSignal.timeout()`. Use SWR's `result.mutate()` to re-fire on demand.
