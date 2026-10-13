---
'@solana/codecs-strings': patch
---

`getBase16Encoder` no longer drops the last digit of odd-length strings longer than one character: `'abc'` now encodes to `[0xab, 0x0c]` instead of `[0xab, 0x00]`, and `write` advances by the size `getSizeFromValue` reports.
