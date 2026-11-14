---
'@solana/codecs-data-structures': patch
---

`getEnumCodec` now works with plain objects like `{ Bad: 0, Good: 1 } as const` and with enums that have negative values.
