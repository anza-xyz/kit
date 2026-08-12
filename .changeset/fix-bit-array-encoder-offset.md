---
'@solana/codecs-data-structures': patch
---

Fix `getBitArrayEncoder` returning the wrong next offset. Its `write` returned `size` instead of `offset + size`, so a bit array placed before another field in a struct or tuple was overwritten by the following field. It now returns `offset + size`, matching the decoder and the other codecs.
