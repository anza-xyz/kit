---
'@solana/subscribable': major
'@solana/kit': major
'@solana/react': major
---

Streamline the `ReactiveStreamStore` contract by removing deprecated members and unifying its state accessor with `ReactiveActionStore`. The `getUnifiedState()` method has been renamed to `getState()`, and the deprecated value-only `getState()`, `getError()`, and `retry()` members along with the `ReactiveStore` type alias have been removed.

**BREAKING CHANGES**

**`getUnifiedState()` renamed to `getState()`.** The unified `{ data, error, status }` snapshot accessor is now simply `getState()`, matching `ReactiveActionStore.getState()`.

```diff
- const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
+ const state = useSyncExternalStore(store.subscribe, store.getState);
```

**Removed the deprecated value-only `getState()` and `getError()`.** Read the value and error off the unified snapshot instead.

```diff
- const data = store.getState();
- const error = store.getError();
+ const { data, error } = store.getState();
```

**Removed `retry()`.** Use `connect()`, which always (re)connects regardless of status. Wrap it with a status guard if you need the error-only behavior.

```diff
- store.retry();
+ if (store.getState().status === 'error') store.connect();
```

**Removed the `ReactiveStore` type alias.** Use `ReactiveStreamStore` directly.

```diff
- import type { ReactiveStore } from '@solana/subscribable';
+ import type { ReactiveStreamStore } from '@solana/subscribable';
```
