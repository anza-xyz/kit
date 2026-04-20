---
'@solana/subscribable': minor
---

Added `createActionStore` — a framework-agnostic state machine that wraps an async function and exposes a `{ dispatch, dispatchAsync, getState, subscribe, reset }` contract compatible with `useSyncExternalStore`, Svelte stores, Vue's `shallowRef`, and similar reactive primitives. `dispatch` is synchronous and fire-and-forget (safe from UI event handlers); `dispatchAsync` returns a promise that resolves to the wrapped function's result and rejects on failure or supersede — use `isAbortError` from `@solana/promises` to filter aborts. Each call creates a fresh `AbortController` and aborts the previous one, so rapid successive dispatches only produce one final state transition — the outcome of the most recent call.
