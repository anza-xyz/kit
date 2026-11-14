---
'@solana/rpc-api': patch
'@solana/rpc-graphql': patch
'@solana/rpc-subscriptions-api': patch
'@solana/rpc-types': patch
---

Keep the reward `commissionBps` field (SIMD-0291) a `number` and add it, along with the `getInflationReward` `blockRewardAmount`, to the response types

Agave sends a basis-point vote commission (`commissionBps`) on block and transaction rewards and on `getInflationReward`. It was missing from the `Reward` and `getInflationReward` types and was upcast to a `bigint` while its sibling `commission` stayed a `number`. `commissionBps` is now declared, kept a `number` across `getInflationReward`, `getBlock`, `getTransaction`, `getTransactionsForAddress` and `blockNotifications`, and exposed on the GraphQL `Reward` type. `getInflationReward` also declares `blockRewardAmount` as `Lamports | null`: Agave 4.5 (currently in beta) returns `null` when block revenue sharing is not enabled in the epoch, and earlier versions omit it.
