---
'@solana/react': minor
---

Add `useSubscriptionQuery(key, source, options?)` to the `@solana/react/query` subpath — the TanStack Query-backed counterpart to `useSubscription`, for streams with no one-shot RPC fetch. It routes a long-lived stream through TanStack Query's cache via `experimental_streamedQuery`, so components reading the same `key` share one connection and the stream shows up in TanStack Query's devtools.

```tsx
import { useSubscriptionQuery } from '@solana/react/query';

const { data, error } = useSubscriptionQuery(['slot'], client.rpcSubscriptions.slotNotifications());
```

The source matches `useSubscription`: a `ReactiveStreamSource<T>`. The hook also accepts a raw `(signal: AbortSignal) => AsyncIterable<T>` factory, as `experimental_streamedQuery` is built on `AsyncIterable`. `data` is the raw notification — the `SolanaRpcResponse` envelope is not unwrapped — matching `useSubscription`. Pass `null` for `source` to disable (TanStack's `enabled: false`); call `result.refetch()` to reconnect. Defaults `retry: false`, `staleTime: Infinity`, and `refetchOnWindowFocus: false` so a focus revalidation doesn't tear down and re-open the connection.