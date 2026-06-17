---
'@solana/react': minor
---

Add a `@solana/react/query` subpath that bridges Kit's reactive primitives into [TanStack Query](https://tanstack.com/query). The new `useRequestQuery(key, source, options?)` hook is the TanStack Query-backed counterpart to `useRequest` — it accepts the same `ReactiveActionSource<T>` or `(signal: AbortSignal) => Promise<T>` source shape, routes it through TanStack's cache, and threads the query's cancellation signal (combined with the optional `getAbortSignal` factory) into the source. Pass a `null` source to disable the query (mapped to TanStack's `enabled: false`). `@tanstack/react-query@^5` is an optional peer dependency.
