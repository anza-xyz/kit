---
'@solana/react': minor
---

Add `useSubscriptionSwr(key, source, options?)` to the `@solana/react/swr` subpath — the SWR-backed counterpart to `useSubscription`. Routes a `ReactiveStreamSource<T>` through SWR's subscription cache (`useSWRSubscription`).

```tsx
import { useSubscriptionSwr } from '@solana/react/swr';

const { data } = useSubscriptionSwr(['account', address], client.rpcSubscriptions.accountNotifications(address));
// data is `{ slot: Slot | undefined; value: TItem } | undefined`
```

`data` is a `SlotTaggedValue<T>` — `data.value` is the unwrapped notification (`SolanaRpcResponse` envelopes are decomposed automatically) and `data.slot` is lifted from `context.slot` (or `undefined` for raw notifications). Mirrors core `useSubscription`'s top-level `{ data, slot }` flattened into SWR's `data` slot. Pass `null` for either `key` or `source` to disable. Options accept SWR's config plus `getAbortSignal` for per-connection signals.
