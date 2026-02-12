---
'@solana/codecs-data-structures': minor
---

Adds new functions `getPredicateEncoder`, `getPredicateDecoder` and `getPredicateCodec`.

These can be used to write an encoder that switches between two encoders based on the value being encoded, or a decoder that switches between two decoders based on the byte array being decoded.