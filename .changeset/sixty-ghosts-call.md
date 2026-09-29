---
'@solana/codecs-data-structures': minor
'@solana/errors': minor
---

Fix an infinite loop in the `array`, `set`, and `map` codecs' sentinel and remainder decoding strategies. A zero-byte item codec (e.g. `getStructCodec([])`) can never advance past a sentinel boundary or the end of the byte array, so decoding used to push elements until the process ran out of memory. Decoding now throws a new error instead: `SOLANA_ERROR__CODECS__ITEM_CONSUMED_NO_BYTES`.
