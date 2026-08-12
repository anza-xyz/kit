---
'@solana/rpc-transformers': minor
'@solana/rpc-api': patch
---

Stop upcasting token balance `uiAmount` and related numerics to `bigint`

The response transformer upcasts every JSON integer to a `bigint` unless its keypath appears in an allow-list. Because the upcast only applies to integers, `uiTokenAmount.uiAmount` — an `f64` on the server — arrived as a `bigint` when the balance happened to be a whole number and as a `number` when it was fractional, so its declared type was correct for some values and wrong for others.

- `uiTokenAmount.uiAmount` is now allow-listed on `getTransaction`, `getBlock`, and `getTransactionsForAddress` token balances.
- `simulateTransaction` had no token balance keypaths allow-listed at all, so `accountIndex` and `uiTokenAmount.decimals` were upcast there as well. All three are now allow-listed.

`@solana/rpc-transformers` additionally exports a new `tokenBalancesConfigs` array of token-balance-relative keypaths, alongside the existing `innerInstructionsConfigs` and `messageConfig`.
