---
'@solana/rpc-api': minor
'@solana/rpc-parsed-types': minor
'@solana/errors': minor
'@solana/kit': minor
---

Update RPC types for Agave v3.x validator compatibility.

**`@solana/rpc-parsed-types`**: `JsonParsedVoteAccount` now includes `blockRevenueCollector`, `blockRevenueCommissionBps`, `blsPubkeyCompressed`, `inflationRewardsCollector`, `inflationRewardsCommissionBps`, `pendingDelegatorRewards`, and a `latency` field on each vote entry.

**`@solana/rpc-api`**: `SimulateTransactionApiResponseBase` now includes `fee`, `loadedAddresses`, `preBalances`, `postBalances`, `preTokenBalances`, and `postTokenBalances`.

**`@solana/errors`**: `RpcSimulateTransactionResult` updated with the same new fields.

**Note on `replacementBlockhash`**: Agave v3.x validators now always return `replacementBlockhash` in `simulateTransaction` responses (as `null` when `replaceRecentBlockhash` is not set). Kit's types still model this field as conditionally present based on config. A future breaking change will move it to the base response type as `TransactionBlockhashLifetime | null` to match v3.x behavior. Consumers using v3.x validators may see this field at runtime even when Kit's types don't surface it.

**Note on Agave v3.x validator behavior**: Validators running Agave v3.x no longer return a dedicated `TRANSACTION_SIGNATURE_VERIFICATION_FAILURE` RPC error for invalid signatures in `simulateTransaction` or `sendTransaction`. Instead, `simulateTransaction` returns a result with `err: "SignatureFailure"`, and `sendTransaction` returns a preflight failure with the signature error as the cause. This is a validator-level change and does not affect Kit's API surface.
