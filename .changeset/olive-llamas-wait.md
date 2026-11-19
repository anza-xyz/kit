---
'@solana/codecs-numbers': patch
---

Reject non-minimal ("alias") `shortU16` encodings in `getShortU16Decoder`. A zero-valued terminating byte after the first byte adds no value bits, so the value could have been encoded in fewer bytes; Agave's `short_vec` decoder rejects these, so Kit now throws `SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH` instead of decoding them.
