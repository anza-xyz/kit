---
'@solana/errors': patch
---

The `unitsConsumed` property in simulation result errors was incorrectly marked as a `number` when it is in fact a `bigint`
