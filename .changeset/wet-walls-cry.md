---
'@solana/codecs-data-structures': patch
---

`getEnumCodec` now works with plain objects like `{ Bad: 0, Good: 1 } as const` and with enums that have negative values, and sorts numerical values numerically so `-2` comes before `-1` and `2` before `10`.
