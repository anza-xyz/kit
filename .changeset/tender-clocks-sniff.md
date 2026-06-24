---
'@solana/plugin-core': major
'@solana/kit': major
---

Remove deprecated `getMinimumBalanceForRentExemption` and `createEmptyClient`.

**BREAKING CHANGES**

**Removed `getMinimumBalanceForRentExemption` from `@solana/kit`.** The minimum balance for an account is being actively reduced (see [SIMD-0437](https://github.com/solana-foundation/solana-improvement-documents/pull/437)) and is expected to become dynamic in future Solana upgrades (see [SIMD-0194](https://github.com/solana-foundation/solana-improvement-documents/pull/194) and [SIMD-0389](https://github.com/solana-foundation/solana-improvement-documents/pull/389)), so a hardcoded local computation can no longer return accurate results. Use the `getMinimumBalanceForRentExemption` RPC method or a `ClientWithGetMinimumBalance` plugin instead.

```diff
- import { getMinimumBalanceForRentExemption } from '@solana/kit';
- const rentExemptLamports = getMinimumBalanceForRentExemption(82n);
+ const { value: rentExemptLamports } = await rpc.getMinimumBalanceForRentExemption(82n).send();
```

**Removed `createEmptyClient` from `@solana/plugin-core`.** Use `createClient`, which behaves identically and additionally accepts an optional initial value.

```diff
- import { createEmptyClient } from '@solana/plugin-core';
- const client = createEmptyClient();
+ import { createClient } from '@solana/plugin-core';
+ const client = createClient();
```
