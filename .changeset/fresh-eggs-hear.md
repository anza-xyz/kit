---
'@solana/react': minor
---

Add `useRequest` — a React hook for one-shot RPC (or similar) reads. Pass a memoized `ReactiveActionSource<T>` (satisfied by `PendingRpcRequest`) and the hook fires the request on mount, re-fires whenever the source identity changes, and aborts the in-flight call on cleanup.

```tsx
const source = useMemo(() => client.rpc.getLatestBlockhash(), [client]);
const { data, error, refresh } = useRequest(source);
```

The result reports `status` as one of `loading | loaded | error | retrying | disabled`. After a prior success, calling `refresh()` keeps `data` populated and reports `status: 'retrying'` so UIs can show stale content while revalidating instead of flashing to blank. Pass `null` for the source to gate the request off — useful while inputs aren't yet known. The result then reports `status: 'disabled'`.

Optional `perRequestSignal: () => AbortSignal` is a factory invoked on every attempt (initial fire + every `refresh()`). The returned signal is passed through to the underlying `.reactiveStore({ perRequestSignal })`. The natural use is per-attempt timeouts: `perRequestSignal: () => AbortSignal.timeout(5_000)` gives every attempt its own 5-second clock that resets on refresh. The factory is held in a ref synced to the latest render, so inline closures are fine — no `useCallback` needed.

The new `RequestResult<T>` and `UseRequestOptions` types are exported alongside the hook so plugin hooks built on top can declare their return shape against them.
