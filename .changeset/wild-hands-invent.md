---
'@solana/codecs-data-structures': minor
---

Adds new functions `getPatternMatchEncoder`, `getPatternMatchDecoder` and `getPatternMatchCodec`.

These can be used to write an encoder that switches between any number of encoders based on the value being encoded, or a decoder that switches between any number of decoders based on the byte array being decoded.

For example for the encoder, the input is a list of [predicate, encoder] pairs. Each predicate is a function from the value being encoded to true/false. The encoder used is the first one where its predicate is true.
