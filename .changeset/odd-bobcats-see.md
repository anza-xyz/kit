---
'@solana/subscribable': major
'@solana/kit': major
---

Collapse `loading` and `retrying` into a single `loading` status on `ReactiveStreamStore`, mirroring the action store's `running` (which is itself the merged "first call vs subsequent call" state). `data` and `error` are preserved through `loading` for stale-while-revalidate — UI can render the prior outcome alongside an in-flight reconnect.

`ReactiveState<T>` drops the `retrying` variant. `loading` widens from `{ data: undefined, error: undefined }` to `{ data: T | undefined, error: unknown }`. Both `createReactiveStoreFromDataPublisherFactory` and `createReactiveStoreWithInitialValueAndSlotTracking` now transition every `connect()` through `loading` (preserving `currentState.data` and `currentState.error`); a subsequent `loaded` clears `error`, a subsequent `error` replaces it.

```ts
// Previously:
{ status: 'error', data: lastValue, error: caughtError }
// connect() →
{ status: 'retrying', data: lastValue, error: undefined }  // error cleared, separate status

// Now:
{ status: 'error', data: lastValue, error: caughtError }
// connect() →
{ status: 'loading', data: lastValue, error: caughtError }  // error preserved, unified status
```

Migration: replace `status === 'retrying'` checks with `status === 'loading' && data !== undefined` (or just `status === 'loading'` if you don't need to distinguish first-load vs reconnect — the SWR pattern lets you render whatever is in `data` regardless).
