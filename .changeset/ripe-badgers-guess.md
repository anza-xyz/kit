---
'@solana/rpc-parsed-types': major
'@solana/rpc-transformers': major
'@solana/rpc-api': major
'@solana/rpc-graphql': minor
---

Update RPC and parsed-account types to match Agave 4.1.0, and surface basis-points commission and vote-latency fields as numbers instead of bigints.

**BREAKING CHANGES**

**Parsed vote-account commissions and vote latency are now `number` instead of `bigint`.** Agave returns these as small bounded integers (`u16`/`u8`), so kit no longer upcasts them. This affects `blockRevenueCommissionBps`, `inflationRewardsCommissionBps`, and each vote's `latency` on `JsonParsedVoteAccount`.

```diff
- const bps: bigint = voteAccount.inflationRewardsCommissionBps;
+ const bps: number = voteAccount.inflationRewardsCommissionBps;
```

**The parsed rent sysvar is now a union of the current and pre-4.1.0 shapes.** Agave 4.1.0 reshaped the rent sysvar from `{ burnPercent, exemptionThreshold, lamportsPerByteYear }` to `{ lamportsPerByte }`. The type is now a union of both, so consumers must narrow before accessing the legacy fields. Narrow on the presence of `lamportsPerByte` (current) versus `lamportsPerByteYear` (deprecated).

```diff
- const perByteYear = rent.info.lamportsPerByteYear;
+ const perByte = 'lamportsPerByte' in rent.info
+     ? rent.info.lamportsPerByte
+     : rent.info.lamportsPerByteYear;
```

**`warmupCooldownRate` on the parsed stake delegation is now optional.** Agave 4.1.0 removed it from the parsed output, so it is only present on accounts fetched from validators running earlier versions. It is marked `@deprecated`.

Additionally, `getVoteAccounts` now includes an optional `inflationRewardsCommissionBps` field (added by Agave 4.1.0; absent on older validators), and the parsed stake-config account fields (`slashPenalty`, `warmupCooldownRate`) are marked `@deprecated` because the stake config program is no longer recognized by the RPC's JSON parser as of Agave 4.1.0 (such accounts now fall back to annotated base64).

The GraphQL `SysvarRentAccount` type gains a nullable `lamportsPerByte` field to match the reshaped rent sysvar in Agave 4.1.0. The legacy `burnPercent`, `exemptionThreshold`, and `lamportsPerByteYear` fields are retained (and remain nullable) for validators running earlier versions.
