---
'@solana/codecs-core': patch
---

`addEncoderSentinel` now throws `SOLANA_ERROR__CODECS__ENCODED_BYTES_MUST_NOT_INCLUDE_SENTINEL` when the encoded bytes end with the start of the sentinel, instead of writing bytes the decoder cuts short.
