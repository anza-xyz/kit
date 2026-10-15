---
"@solana/codecs-core": patch
---

Fix `toArrayBuffer` dropping data when given a negative `offset`. The offset is now resolved against the end of the byte array, like `Array.prototype.slice`, so `toArrayBuffer(bytes, -1, 1)` returns the final byte instead of an empty buffer.
