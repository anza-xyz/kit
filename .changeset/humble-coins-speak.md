---
'@solana/react': minor
---

Add `useSubscriptionSWR(key, source, options?)` to the `@solana/react/swr` subpath — the SWR-backed counterpart to `useSubscription`. Routes a `ReactiveStreamSource<T>` through SWR's subscription cache (`useSWRSubscription`).

```tsx
import { useSubscriptionSWR } from '@solana/react/swr';

const { data } = useSubscriptionSWR(['account', address], client.rpcSubscriptions.accountNotifications(address));
```

`data` is the notification exactly as the source emits it. Pass `null` for either `key` or `source` to disable. Options accept SWR's config plus `getAbortSignal` for an abort signal.
