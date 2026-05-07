---
'@solana/react': minor
'@solana/errors': minor
---

Add `ClientProvider`, `useClient`, and `useClientCapability` — the Kit client context layer for React.

`ClientProvider` publishes a caller-owned Kit client to its subtree. Required by `useClient`, `useClientCapability`, and any plugin-specific hook that depends on a client capability — generic primitives like `useAction` work against arbitrary async functions and don't need a provider. The provider accepts both synchronous clients and promise-returning ones — when given a promise (e.g. `createClient().use(asyncPlugin())`), it suspends via the nearest `<Suspense>` boundary until the client resolves. On React 19 it delegates to `React.use(promise)`; on React 18 an internal thrown-promise shim, keyed by promise identity, honours the same contract.

`useClient<TClient>()` is the basic context accessor. Defaults to the base `Client` shape; callers who know a specific plugin is installed may widen the type via the generic. Throws a new `SolanaError` with code `SOLANA_ERROR__REACT__MISSING_PROVIDER` when called outside a provider.

`useClientCapability<TClient>({ capability, hookName, providerHint })` runtime-checks that the requested capability (or capabilities) is installed on the client and throws `SOLANA_ERROR__REACT__MISSING_CAPABILITY` — surfacing the calling `hookName` and a `providerHint` — when it isn't. Plugin-hook authors use this to fail loudly at mount instead of letting a missing plugin surface later as `undefined`.

Two new error codes (`SOLANA_ERROR__REACT__MISSING_PROVIDER`, `SOLANA_ERROR__REACT__MISSING_CAPABILITY`) are reserved in the `[9000000-9000999]` range.
