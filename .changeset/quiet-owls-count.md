---
'@solana/rpc-parsed-types': patch
'@solana/rpc-graphql': patch
---

Fix the parsed `epochRewards` sysvar type to match what Agave returns. The `jsonParsed` info has `active`, `distributedRewards`, `distributionStartingBlockHeight`, `numPartitions`, `parentBlockhash`, `totalPoints` and `totalRewards`, and the reward amounts and points are strings. The old type described a `distributionCompleteBlockHeight` field that Agave does not return, and typed the amounts as `bigint`.
