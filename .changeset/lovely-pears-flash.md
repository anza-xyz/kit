---
'@solana/rpc-api': patch
'@solana/errors': patch
---

Corrected the type of `unitsConsumed` in simulation responses. It used to incorrectly be typed as a `number` when it should have been a `bigint`
