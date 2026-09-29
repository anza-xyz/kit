---
'@solana/codecs-data-structures': minor
'@solana/errors': minor
---

Fix an infinite loop in the `array`, `set`, and `map` codecs' sentinel and remainder decoding strategies: a zero-byte item codec (e.g. `getStructCodec([])`) can never advance past a sentinel boundary or the end of the byte array, so decoding used to push elements until the process ran out of memory. Zero-byte fixed-size item codecs are now rejected on both the encoding and decoding sides when used with the sentinel or remainder strategies, throwing a new error instead: `SOLANA_ERROR__CODECS__UNEXPECTED_ZERO_FIXED_SIZE_ITEM_FOR_ARRAY_LIKE_SIZE_STRATEGY`. They remain allowed when the collection size is explicit.
