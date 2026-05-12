---
'@solana/subscribable': minor
---

Add `store.withSignal(signal)` on `ReactiveActionStore` for attaching a caller-provided `AbortSignal` to a dispatch. The method returns a thin wrapper exposing only `dispatch` / `dispatchAsync`; the supplied signal is composed with the store's internal per-dispatch controller via `AbortSignal.any`, so aborting either cancels the in-flight call and surfaces the abort reason on state. The bare `dispatch` / `dispatchAsync` signatures are unchanged — this is additive.

Two common patterns the wrapper enables:

- **Per-attempt timeout.** `store.withSignal(AbortSignal.timeout(5_000)).dispatch(args)` — a fresh clock per call. Different call sites can pass different timeouts.
- **Shared kill switch.** Hold one `AbortController`, bind the wrapper once (`const killable = store.withSignal(killCtrl.signal)`), and use `killable.dispatch(...)` everywhere. Aborting the controller cancels the current call and makes future calls on the wrapper start aborted.
