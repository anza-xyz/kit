---
'@solana/codecs-strings': patch
---

Fixed `getBase64Decoder()` throwing `RangeError: Maximum call stack size exceeded` in browser builds when decoding byte arrays larger than roughly 65KB. The bytes are now converted to a binary string in chunks rather than spread into a single `String.fromCharCode` call.
