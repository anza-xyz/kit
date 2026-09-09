---
'@solana/codecs-numbers': minor
---

Add `u256` and `i256` number codecs (`getU256Codec`/`getU256Encoder`/`getU256Decoder` and `getI256Codec`/`getI256Encoder`/`getI256Decoder`), extending the number codecs beyond 128-bit integers. Both support little- and big-endian serialization via the `endian` option and, as with the other large-integer codecs, always decode to a `bigint`.
