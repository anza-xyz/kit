---
'@solana/sysvars': minor
'@solana/kit': minor
'@solana/rpc-graphql': minor
'@solana/rpc-parsed-types': minor
---

Deprecate `exemptionThreshold` and `burnPercent` fields on `SysvarRent` per SIMD-0194. Update `lamportsPerByte` documentation to reflect that rent is no longer time-based. Simplify `getMinimumBalanceForRentExemption` constants to use `DEFAULT_LAMPORTS_PER_BYTE: 6960n` directly.