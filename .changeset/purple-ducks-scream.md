---
'@solana/react': minor
---

Add a `useAirdrop` hook that wraps a client's `airdrop` capability (`ClientWithAirdrop`) as a tracked `useAction`. `dispatch(address, amount)` requests an airdrop with an injected `AbortSignal`, resolving with the transaction `Signature` (or `undefined` when the airdrop is applied without a transaction).
