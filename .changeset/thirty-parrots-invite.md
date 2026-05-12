---
'@solana/subscribable': minor
'@solana/react': minor
---

Preserve the last `error` on a `ReactiveActionStore` through subsequent `running` states, matching the existing stale-while-revalidate behavior for `data`. A re-dispatch after a failure now keeps the previous error visible until the new attempt resolves, mirroring how SWR and TanStack Query handle revalidation. `success` clears the error; `reset()` clears both. This also affects `useAction`, whose `error` field now persists through a new `dispatch()` until the new call resolves.
