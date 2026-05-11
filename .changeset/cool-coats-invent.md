---
'@solana/subscribable': minor
'@solana/rpc-spec': minor
---

Add a `perRequestSignal: () => AbortSignal | undefined` factory option to `createReactiveActionStore`, forwarded through `PendingRpcRequest.reactiveStore({ perRequestSignal })`. The factory is invoked on every dispatch; the returned signal is composed with the per-dispatch controller via `AbortSignal.any`. Each call to the factory typically yields a fresh signal — natural for per-attempt timeouts (`() => AbortSignal.timeout(5_000)` resets the clock on every dispatch). A permanent kill switch is expressible by returning the same cancellable signal each call (`() => killCtrl.signal`); after `killCtrl.abort()`, every future dispatch starts with an already-aborted signal and surfaces as `error`. The `ReactiveActionSource<T>` duck-type widens to match.

Add a `perConnectionSignal: () => AbortSignal` factory option to `createReactiveStoreFromDataPublisherFactory` (and the `ReactiveStreamSource<T>` duck-type). Same shape as the action-store option but called per connection — i.e. on initial subscribe and on every `retry()`. Composed with the connection's internal controller via `AbortSignal.any`. The pre-existing `abortSignal: AbortSignal` option is preserved for backwards compatibility and marked `@deprecated`; new code should prefer `perConnectionSignal`. The two are mutually compatible: pass either, or both (both compose into the per-connection signal).

Internal refactor: stream-store `connect()` plumbing now uses `AbortSignal.any` consistently instead of a manually-scoped abort forwarder, and reads the caller's `abortSignal` directly without an intermediate `outerController`. Same observable behaviour.

The shared `@solana/test-config` browser environment polyfills `AbortSignal.any` because jsdom 22 (the version pinned here) doesn't ship it. Replacing the AbortSignal class wholesale would break jsdom's brand checks for `addEventListener({ signal })`, so the patch is limited to the missing static method.
