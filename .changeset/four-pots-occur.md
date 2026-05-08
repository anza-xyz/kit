---
'@solana/react': minor
---

Add `useAction` — a React hook that bridges any async function into a tracked action with `dispatch` / `status` / `data` / `error` / `reset` and supersede-on-second-call semantics. Built on `createReactiveActionStore` from `@solana/subscribable`.

The wrapped function receives a fresh `AbortSignal` per `send(...)`. Calling `dispatch` again while a prior call is in flight aborts the first; awaiters of the superseded call see a rejection with an `AbortError` filterable via `isAbortError` from `@solana/promises`. `data` from a prior `success` persists through subsequent `running` states for stale-while-revalidate UX; only `reset()` clears it.

`fn` is held in a ref synced to the latest render's closure, so values it captures (form state, route params, etc.) are always fresh on each new `send(...)` without the caller needing to maintain a `deps` array. In-flight calls are unaffected — they continue with the closure they captured at dispatch time. Matches the convention used by `useMutation` in TanStack Query and `useWriteContract` in wagmi.

The shared `ActionResult<TArgs, TResult>` type is also exported so plugin hooks can declare their return shape against it.
