---
'@solana/rpc-subscriptions-api': major
'@solana/rpc-graphql': major
'@solana/rpc-types': major
---

Removed `rentEpoch` from the `AccountInfoBase` type. This property is no longer relevant post SIMD-215. Developers whose applications rely on this property being numeric should either eliminate it or hardcode it to `18_446_744_073_709_551_615n`.
