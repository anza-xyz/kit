---
'@solana/kit': minor
---

Re-export `@solana/promises` from `@solana/kit`

`@solana/kit` now re-exports the `@solana/promises` package, so its helpers — `isAbortError`, `getAbortablePromise`, and `safeRace` — are available directly from `@solana/kit` without a separate dependency. This is particularly useful alongside `@solana/react`'s `useAction`, whose superseded or aborted dispatches reject with an `AbortError` that callers filter using `isAbortError`.
