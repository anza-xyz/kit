---
'@solana/react': minor
---

Add `useSubscriptionSwr(key, source, options?)` to the `@solana/react/swr` subpath — the SWR-backed counterpart to `useSubscription`. Routes a `ReactiveStreamSource<T>` through SWR's subscription cache (`useSWRSubscription`).

```tsx
import { useSubscriptionSwr } from '@solana/react/swr';

const { data } = useSubscriptionSwr(['account', address], client.rpcSubscriptions.accountNotifications(address));
// For envelope sources: data is `SolanaRpcResponse<{ lamports: bigint }> | undefined`
```

`data` is the notification exactly as the source emits it — no unwrapping. For RPC subscriptions that emit `SolanaRpcResponse<U>` envelopes, read the inner value at `data.value` and the slot at `data.context.slot`. For raw notifications (slot/logs/root), `data` is the raw shape. Mirrors core `useSubscription`'s result so moving between the two is a pure swap. Pass `null` for either `key` or `source` to disable. Options accept SWR's config plus `getAbortSignal` for per-connection signals.
