---
'@solana/react': minor
---

Add `useSubscription` — a React hook for subscription-based live data. Pass a `ReactiveStreamSource<T>` (satisfied by `PendingRpcSubscriptionsRequest`) and the hook opens the subscription on mount, re-opens whenever the source identity changes, and tears it down on unmount.

```tsx
function AccountBalance({ address }: { address: Address }) {
    const client = useClient<ClientWithRpcSubscriptions<AccountNotificationsApi>>();
    const source = useMemo(() => client.rpcSubscriptions.accountNotifications(address), [client, address]);
    const { data, error, reconnect } = useSubscription(source);
    if (error) return <button onClick={reconnect}>Reconnect</button>;
    return <p>{data ? `${data.value.lamports} lamports at slot ${data.context.slot}` : 'Connecting…'}</p>;
}
```

The result reports `status` as one of `loading | loaded | error | disabled`. `data` is the notification exactly as the source emits it — no unwrapping or reshaping. For RPC subscriptions that emit `SolanaRpcResponse<U>` (account/program/signature), read the inner value at `data.value` and the slot at `data.context.slot`; for raw notifications (slot/logs/root) `data` is the raw shape. Pass `null` for the source to gate the subscription off — useful while inputs aren't yet known. The result then reports `status: 'disabled'`. After a notification arrives, an error transitions to `status: 'error'` while preserving the stale `data`; `reconnect()` returns to `loading` (preserving stale `data` and `error` for stale-while-revalidate) before settling on `loaded` or a fresh `error`.

Optional `getAbortSignal: () => AbortSignal` is a factory invoked on every connection (initial subscribe + every `reconnect()`). Each connection gets a fresh signal that the underlying store composes with its per-connection controller via `AbortSignal.any`. The natural use is per-connection timeouts: `getAbortSignal: () => AbortSignal.timeout(30_000)` gives every connection its own 30-second clock that resets on reconnect. The factory is held in a ref synced to the latest render, so inline closures are fine — no `useCallback` needed. `reconnect()` also accepts an optional `{ abortSignal }` override to replace the factory for one specific attempt (presence-based: omit to use the factory, `{ abortSignal: signal }` to override, `{ abortSignal: undefined }` to opt out).

The hook mirrors `useRequest`'s structure exactly: construct the lazy store via `useMemo`, fire `store.connect()` in a `useEffect`, tear down via `store.reset()` in cleanup. Same StrictMode-safe lifecycle, same vocabulary, same per-call signal API. SSR-safe — on the server the connect effect doesn't run, so the store stays `idle` and the hook reports `status: 'loading'`; first client render hydrates from the same paint and commits the connect.

`SubscriptionResult<T>` and `UseSubscriptionOptions` are exported alongside the hook so plugin hooks built on top can declare their return shape against them.
