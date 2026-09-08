---
'@solana/codecs-data-structures': minor
---

Add a `requireSizePrefix` option to the array, map and set codecs. By default, decoding an exhausted byte array yields an empty collection so that collections can be appended to existing data layouts; with `requireSizePrefix: true`, a missing size prefix throws instead.
