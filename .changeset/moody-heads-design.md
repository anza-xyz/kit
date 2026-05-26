---
'@solana/react': minor
---

Add `useTrackedData` — a React hook for an RPC subscription seeded by a one-shot RPC fetch, slot-deduped. The subscription (e.g. `accountNotifications`) is the primary source of live updates; the initial fetch (e.g. `getBalance`, `getAccountInfo`) provides a value to surface as soon as it resolves — typically before the first subscription notification arrives — so the `loading` paint is shorter than subscription-only would give you. Surfaces a unified `{ data, slot, error, refresh, status }` view. The underlying store slot-dedupes between the two sources — out-of-order arrivals never regress the surfaced value (older slots are dropped silently, so a stale RPC response can't overwrite a fresher subscription notification).

```tsx
function AccountBalance({ address }: { address: Address }) {
    const client = useClient<ClientWithRpc<GetBalanceApi> & ClientWithRpcSubscriptions<AccountNotificationsApi>>();
    const spec = useMemo(
        () => ({
            rpcRequest: client.rpc.getBalance(address),
            rpcSubscriptionRequest: client.rpcSubscriptions.accountNotifications(address),
            rpcValueMapper: (lamports: bigint) => lamports,
            rpcSubscriptionValueMapper: ({ lamports }: { lamports: bigint }) => lamports,
        }),
        [client, address],
    );
    const { data, slot, error, refresh } = useTrackedData(spec);
    if (error) return <button onClick={refresh}>Retry</button>;
    return <p>{data !== undefined ? `${data} lamports at slot ${slot}` : 'Loading…'}</p>;
}
```

The result reports `status` as one of `loading | loaded | error | disabled`. Pass `null` for the spec to gate the work off — useful while inputs aren't yet known (e.g. an `address` that hasn't been selected). After a notification arrives, an error transitions to `status: 'error'` while preserving the stale `data` and `slot`; `refresh()` re-runs both the initial RPC and the subscription, returns `status` to `loading` (preserving stale `data` and `error` for stale-while-revalidate), and settles on `loaded` or a fresh `error`.

Optional `getAbortSignal: () => AbortSignal` is a factory invoked on every attempt (initial run + every `refresh()`). Each attempt gets a fresh signal that the underlying store composes with its per-attempt controller via `AbortSignal.any`. The natural use is per-attempt timeouts: `getAbortSignal: () => AbortSignal.timeout(30_000)` gives every attempt its own 30-second clock that resets on refresh. The factory is held in a ref synced to the latest render, so inline closures are fine — no `useCallback` needed. `refresh()` also accepts an optional `{ abortSignal }` override to replace the factory for one specific attempt (presence-based: omit to use the factory, `{ abortSignal: signal }` to override, `{ abortSignal: undefined }` to opt out).

The hook is built on `createReactiveStoreWithInitialValueAndSlotTracking` from `@solana/kit` — the slot tracking, abort plumbing, and stale-while-revalidate behaviour live one layer down. The React surface reduces to `useSyncExternalStore` glue plus the per-attempt signal API. The Kit primitive's config type is re-shaped as `TrackedDataSpec<TRpcValue, TSubscriptionValue, TItem>` for friendlier use-site naming; the two are mutually assignable. SSR-safe — on the server the connect effect doesn't run, so the store stays `idle` and the hook reports `status: 'loading'`; first client render hydrates from the same paint and commits the connect.

`TrackedDataResult<T>`, `TrackedDataSpec<TRpc, TSub, T>`, and `UseTrackedDataOptions` are exported alongside the hook for plugin hooks built on top.
