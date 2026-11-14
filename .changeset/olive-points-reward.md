---
'@solana/rpc-api': patch
'@solana/rpc-subscriptions-api': patch
'@solana/rpc-types': patch
---

Keep the reward `commissionBps` field (SIMD-0291) a `number` and add it, along with `blockRewardAmount`, to the response types

Agave emits a basis-point vote commission (`commissionBps`) and a `blockRewardAmount` on rewards and on `getInflationReward`. These were missing from the `Reward` and `getInflationReward` types, and `commissionBps` was upcast to a `bigint` while its sibling `commission` stayed a `number`. `commissionBps` is now declared and kept a `number` across `getInflationReward`, `getBlock`, `getTransaction`, `getTransactionsForAddress` and `blockNotifications`, matching how the vote-account bps fields are already handled; `blockRewardAmount` is declared as `Lamports`.
