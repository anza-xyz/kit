---
'@solana/codecs-numbers': patch
---

Fixed `getShortU16Decoder()` silently accepting malformed input: a truncated buffer decoded to garbage with an offset past the end of the byte array, and continuation chains longer than the documented three-byte encoding produced values outside the u16 domain. Truncated input now throws `SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH` and overlong chains throw `SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE`, matching the guards every other number decoder already uses.
