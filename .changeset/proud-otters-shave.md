---
'@solana/codecs-core': patch
---

Fix `toArrayBuffer` returning an empty buffer for negative offsets whose slice extends to the end of the data. A negative offset is now resolved against the end of the buffer before the end index is derived, matching `Array.prototype.slice`.
