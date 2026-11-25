---
'@solana/codecs-core': patch
---

Fix `addEncoderSizePrefix`, `addDecoderSizePrefix` and `addCodecSizePrefix` keeping the `fixedSize` of the wrapped codec when a fixed-size codec is given a variable-size prefix such as `getShortU16Codec()`. The result is now variable-size, so `encode` no longer throws a `RangeError` from a buffer that was allocated without room for the prefix.
