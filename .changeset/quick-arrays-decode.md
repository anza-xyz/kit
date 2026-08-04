---
'@solana/codecs-data-structures': patch
---

Avoid copying the remaining buffer in `getArrayDecoder`'s emptiness check

`getArrayDecoder`'s `read()` tested for an empty byte array with `bytes.slice(offset).length === 0`, which allocates and copies every byte from `offset` to the end just to read `.length` off the result. On large accounts containing many prefixed arrays, maps, or sets this made decoding quadratic in account size. The check is now the equivalent O(1) comparison `offset >= bytes.length`. `getMapDecoder` and `getSetDecoder` delegate to `getArrayDecoder` and benefit as well.
