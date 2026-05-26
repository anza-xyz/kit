---
'@solana/react': patch
'@solana/kit': minor
---

Migrate `@solana/react` to depend on `@solana/kit` as a peer dependency (replacing its individual workspace sub-package deps) and re-export `@solana/subscribable` from `@solana/kit` so React consumers have a single import root. `@solana/promises` remains as a direct dep — it's a small utility that isn't part of Kit's public surface.

For `@solana/react` users:
- `@solana/kit` must now be installed alongside `@solana/react`.
- Apps that already use both get a single deduplicated `@solana/kit` instance — important for anything relying on shared types or `instanceof SolanaError` checks.
- Kit can be bumped independently of React within the peer range.

For `@solana/kit` users:
- `ReactiveStreamSource`, `ReactiveStreamStore`, `ReactiveActionSource`, `ReactiveActionStore`, `ReactiveState`, `createReactiveActionStore`, `createReactiveStoreFromDataPublisherFactory`, `DataPublisher` and the rest of `@solana/subscribable`'s surface are now reachable directly through `@solana/kit`.
