---
'@solana/codecs-strings': patch
---

Fix `getBaseXDecoder` returning an offset of `0` instead of the buffer length when there are no bytes left to decode, which corrupted the offset of any decoder composed after it.
