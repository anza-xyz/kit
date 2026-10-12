---
'@solana/sysvars': patch
---

The `SysvarSlotHashes` and `SysvarRecentBlockhashes` encoders/decoders now use the `u64` length prefix that these sysvar accounts actually have, instead of a `u32` one. Previously every decoded entry was shifted by four bytes, so the slots, hashes and fees came back wrong.
