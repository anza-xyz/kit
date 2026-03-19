---
"@solana/kit": patch
---

Deprecated `getMinimumBalanceForRentExemption`. The minimum balance for an account is being actively reduced (see [SIMD-0437](https://github.com/solana-foundation/solana-improvement-documents/pull/437)) and is expected to become dynamic in future Solana upgrades (see [SIMD-0194](https://github.com/solana-foundation/solana-improvement-documents/pull/194) and [SIMD-0389](https://github.com/solana-foundation/solana-improvement-documents/pull/389)). Use the `getMinimumBalanceForRentExemption` RPC method or a `ClientWithGetMinimumBalance` plugin instead. This function will be removed in v7.
