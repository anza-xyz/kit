---
'@solana/react': minor
---

Add `usePayer` and `useIdentity` React hooks. Each reads the corresponding value off the client and, when the client advertises `subscribeToPayer`/`subscribeToIdentity`, subscribes so the returned signer always reflects the latest payer/identity. Clients whose value is fixed fall back to a one-time read.

If the plugin value throws (for example as the wallet plugin does when it owns payer/identity and a wallet is not connected), this is surfaced as `undefined` in the hooks.