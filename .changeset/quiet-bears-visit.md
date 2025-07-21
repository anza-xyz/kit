---
'@solana/codecs-core': patch
---

`padBytes` now strips extra types from the input array, but otherwise returns the same flavour of `Uint8Array` you gave it, in terms of writability
